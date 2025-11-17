import { Request, Response, NextFunction } from "express";
import createError from "http-errors";
import { extractTextFromPdf } from "@tagmyexpenses/utils";
import { parseC6BankStatement } from "@tagmyexpenses/utils";
import { normalizeMerchant } from "@tagmyexpenses/utils";
import { categorizeTransaction } from "@tagmyexpenses/utils";
import { supabase } from "../config/supabase.js";
import { authenticateUser } from "../middleware/auth.js";
import fs from "fs/promises";
import path from "path";

export const submitPdfPassword = [
  authenticateUser,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const { pendingPdfId, password } = req.body;

      if (!pendingPdfId) {
        throw createError(400, "pendingPdfId is required");
      }

      if (!password || typeof password !== "string" || password.trim().length === 0) {
        throw createError(400, "Password is required");
      }

      const trimmedPassword = password.trim();

      // Get pending PDF record
      const { data: pendingPdf, error: fetchError } = await supabase
        .from("pending_pdfs")
        .select("*")
        .eq("id", pendingPdfId)
        .eq("user_id", user.id)
        .eq("status", "pending")
        .single();

      if (fetchError || !pendingPdf) {
        throw createError(404, "Pending PDF not found or already processed");
      }

      // Update status to processing
      await supabase
        .from("pending_pdfs")
        .update({ status: "processing" })
        .eq("id", pendingPdfId);

      // Read file from local filesystem
      const filePath = path.join(process.cwd(), pendingPdf.file_path);
      let buffer: Buffer;
      
      try {
        buffer = await fs.readFile(filePath);
      } catch (error: any) {
        await supabase
          .from("pending_pdfs")
          .update({
            status: "failed",
            error_message: "Failed to read file from filesystem",
          })
          .eq("id", pendingPdfId);
        throw createError(500, "Failed to read file from filesystem");
      }

      // Try to extract text with password
      let text: string;
      try {
        text = await extractTextFromPdf(buffer, trimmedPassword);
      } catch (error: any) {
        console.error("PDF extraction error with password:", error.message);
        
        // Update status to failed
        await supabase
          .from("pending_pdfs")
          .update({
            status: "failed",
            error_message: error.message || "Failed to extract text from PDF",
          })
          .eq("id", pendingPdfId);

        if (
          error.message?.includes("password") ||
          error.message?.includes("Password") ||
          error.message?.includes("Incorrect password")
        ) {
          throw createError(400, "Incorrect password. Please try again.");
        }
        throw createError(400, `Failed to extract text from PDF: ${error.message || "Unknown error"}`);
      }

      // Parse C6 Bank statement
      const parsedTransactions = parseC6BankStatement(text);

      if (parsedTransactions.length === 0) {
        await supabase
          .from("pending_pdfs")
          .update({
            status: "failed",
            error_message: "No transactions found in PDF",
          })
          .eq("id", pendingPdfId);
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
        await supabase
          .from("pending_pdfs")
          .update({
            status: "failed",
            error_message: "Failed to save transactions",
          })
          .eq("id", pendingPdfId);
        throw createError(500, "Failed to save transactions");
      }

      // Update pending PDF with password and mark as completed
      await supabase
        .from("pending_pdfs")
        .update({
          status: "completed",
          password: trimmedPassword, // Store password for future reference
        })
        .eq("id", pendingPdfId);

      // Clean up file from filesystem
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

