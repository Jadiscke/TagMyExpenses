import { Router } from "express";
import { uploadPdf } from "./upload-pdf.js";
import { submitPdfPassword } from "./submit-pdf-password.js";
import { getTransactions } from "./transactions.js";
import { categorize } from "./categorize.js";
import { updateTransaction } from "./update-transaction.js";

export const routes = Router();

// Health check
routes.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Upload PDF endpoint
routes.post("/upload-pdf", uploadPdf);

// Submit password for pending PDF
routes.post("/submit-pdf-password", submitPdfPassword);

// Get transactions
routes.get("/transactions", getTransactions);

// Categorize transactions
routes.post("/categorize", categorize);

// Update transaction
routes.patch("/transaction/:id", updateTransaction);
