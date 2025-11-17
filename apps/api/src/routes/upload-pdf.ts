import { Request, Response, NextFunction } from "express";
import multer from "multer";
import createError from "http-errors";
import { extractTextFromPdf } from "@tagmyexpenses/utils";
import { parseC6BankStatement } from "@tagmyexpenses/utils";
import { normalizeMerchant } from "@tagmyexpenses/utils";
import { categorizeTransaction } from "@tagmyexpenses/utils";
import { supabase } from "../config/supabase.js";
import { authenticateUser } from "../middleware/auth.js";
import { v4 as uuidv4 } from "uuid";
import fs from "fs/promises";
import path from "path";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(createError(400, "Only PDF files are allowed"));
    }
  },
});

export const uploadPdf = [
  authenticateUser,
  (req: Request, res: Response, next: NextFunction) => {
    upload.single("file")(req, res, (err) => {
      if (err) {
        return next(createError(400, err.message || "File upload error"));
      }
      next();
    });
  },
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;

      // Check if file was uploaded
      if (!req.file) {
        throw createError(400, "No file uploaded");
      }

      const fileName = req.file.originalname;
      const fileBuffer = req.file.buffer;

      // Generate unique file path for local storage
      const fileId = uuidv4();
      const uploadsDir = path.join(process.cwd(), "uploads", user.id);
      const filePath = path.join(uploadsDir, `${fileId}-${fileName}`);

      // Ensure uploads directory exists
      try {
        await fs.mkdir(uploadsDir, { recursive: true });
      } catch (error: any) {
        console.error("Failed to create uploads directory:", error);
        throw createError(500, "Failed to create uploads directory");
      }

      // Save file to local filesystem
      try {
        await fs.writeFile(filePath, fileBuffer);
        console.log("File saved to local filesystem:", filePath);
      } catch (error: any) {
        console.error("Failed to save file:", error);
        throw createError(500, "Failed to save file to filesystem");
      }

      // Store relative path in database (for future S3 migration)
      const relativePath = `uploads/${user.id}/${fileId}-${fileName}`;

      // Try to extract text from PDF (without password first)
      let text: string;
      let needsPassword = false;
      
      try {
        text = await extractTextFromPdf(fileBuffer);
      } catch (error: any) {
        console.error("PDF extraction error:", error.message);
        
        // Check if it's a password error
        if (
          error.message?.includes("password") ||
          error.message?.includes("Password") ||
          error.message?.includes("password protected")
        ) {
          needsPassword = true;
        } else {
          // Other error - delete the file and return error
          try {
            await fs.unlink(filePath);
          } catch (unlinkError) {
            console.error("Failed to delete file:", unlinkError);
          }
          throw createError(400, `Failed to extract text from PDF: ${error.message || "Unknown error"}`);
        }
      }

      // If password is needed, save to pending_pdfs and return
      if (needsPassword) {
        // Verify table exists by trying a simple query first
        const { error: tableCheckError } = await supabase
          .from("pending_pdfs")
          .select("id")
          .limit(1);
        
        if (tableCheckError && tableCheckError.code === "42P01") {
          // Table doesn't exist
          console.error("pending_pdfs table does not exist. Please run the schema.sql migration.");
          try {
            await fs.unlink(filePath);
          } catch (unlinkError) {
            console.error("Failed to delete file:", unlinkError);
          }
          throw createError(500, "Database table 'pending_pdfs' does not exist. Please run the schema migration.");
        }

        const { data: pendingPdf, error: insertError } = await supabase
          .from("pending_pdfs")
          .insert({
            user_id: user.id,
            file_name: fileName,
            file_path: relativePath,
            status: "pending",
          })
          .select()
          .single();

        if (insertError) {
          console.error("Failed to save pending PDF:", insertError);
          console.error("Error details:", JSON.stringify(insertError, null, 2));
          console.error("User ID:", user.id);
          console.error("File path:", relativePath);
          // Clean up file
          try {
            await fs.unlink(filePath);
          } catch (unlinkError) {
            console.error("Failed to delete file:", unlinkError);
          }
          throw createError(500, `Failed to save pending PDF record: ${insertError.message || JSON.stringify(insertError)}`);
        }

        return res.status(200).json({
          success: false,
          needsPassword: true,
          pendingPdfId: pendingPdf.id,
          message: "PDF is password protected. Please provide the password.",
        });
      }

      // Parse C6 Bank statement
      const parsedTransactions = parseC6BankStatement(text);

      if (parsedTransactions.length === 0) {
        throw createError(400, "No transactions found in PDF");
      }

      // Process transactions
      const transactionsToInsert = parsedTransactions.map((transaction) => {
        const normalizedMerchant = normalizeMerchant(transaction.merchant);
        const category = categorizeTransaction({
          merchant: transaction.merchant,
          rawDescription: transaction.rawDescription,
        });

        return {
          user_id: user.id,
          date: transaction.date,
          merchant: transaction.merchant,
          normalized_merchant: normalizedMerchant,
          amount: transaction.amount,
          currency: "BRL",
          raw_description: transaction.rawDescription,
          category,
        };
      });

      // Insert into Supabase
      const { data: insertedTransactions, error: insertError } = await supabase
        .from("transactions")
        .insert(transactionsToInsert)
        .select();

      if (insertError) {
        console.error(insertError);
        // Clean up file on error
        try {
          await fs.unlink(filePath);
        } catch (unlinkError) {
          console.error("Failed to delete file:", unlinkError);
        }
        throw createError(500, "Failed to save transactions");
      }

      // Clean up file after successful processing
      try {
        await fs.unlink(filePath);
      } catch (unlinkError) {
        console.error("Failed to delete file:", unlinkError);
      }

      res.json({
        success: true,
        count: insertedTransactions?.length || 0,
        transactions: insertedTransactions,
      });
    } catch (error: any) {
      next(error);
    }
  },
];
