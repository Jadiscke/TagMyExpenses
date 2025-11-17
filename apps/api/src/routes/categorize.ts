import { Request, Response, NextFunction } from "express";
import createError from "http-errors";
import { categorizeTransactions } from "@tagmyexpenses/utils";
import { supabase } from "../config/supabase.js";
import { Transaction } from "@tagmyexpenses/utils";
import { authenticateUser } from "../middleware/auth.js";

export const categorize = [
  authenticateUser,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const { transactionIds } = req.body;

      if (!transactionIds || !Array.isArray(transactionIds)) {
        throw createError(400, "transactionIds must be an array");
      }

      // Fetch transactions
      const { data: transactions, error: fetchError } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .in("id", transactionIds);

      if (fetchError) {
        console.error(fetchError);
        throw createError(500, "Failed to fetch transactions");
      }

      if (!transactions || transactions.length === 0) {
        throw createError(404, "No transactions found");
      }

      // Convert to Transaction format and categorize
      const transactionsToCategorize: Transaction[] = transactions.map((t) => ({
        id: t.id,
        userId: t.user_id,
        date: t.date,
        merchant: t.merchant,
        normalizedMerchant: t.normalized_merchant,
        amount: t.amount,
        currency: t.currency,
        rawDescription: t.raw_description,
        category: t.category,
      }));

      const categorized = categorizeTransactions(transactionsToCategorize);

      // Update transactions in database
      const updates = categorized.map((t) =>
        supabase
          .from("transactions")
          .update({ category: t.category })
          .eq("id", t.id)
          .eq("user_id", user.id)
      );

      const results = await Promise.all(updates);
      const errors = results.filter((r) => r.error);

      if (errors.length > 0) {
        console.error(errors);
        throw createError(500, "Failed to update some transactions");
      }

      res.json({
        success: true,
        count: categorized.length,
        transactions: categorized,
      });
    } catch (error: any) {
      next(error);
    }
  },
];
