import { Request, Response, NextFunction } from "express";
import createError from "http-errors";
import { supabase } from "../config/supabase.js";
import { normalizeMerchant } from "@tagmyexpenses/utils";
import { authenticateUser } from "../middleware/auth.js";

export const updateTransaction = [
  authenticateUser,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      const { id } = req.params;
      const { category, merchant, normalizedMerchant } = req.body;

      if (!category && !merchant && !normalizedMerchant) {
        throw createError(400, "At least one field must be provided");
      }

      // Build update object
      const updateData: any = {};

      if (category !== undefined) {
        updateData.category = category;
      }

      if (merchant !== undefined) {
        updateData.merchant = merchant;
        // Auto-normalize if not provided
        if (normalizedMerchant === undefined) {
          updateData.normalized_merchant = normalizeMerchant(merchant);
        }
      }

      if (normalizedMerchant !== undefined) {
        updateData.normalized_merchant = normalizedMerchant;
      }

      // Update transaction
      const { data: updatedTransaction, error: updateError } = await supabase
        .from("transactions")
        .update(updateData)
        .eq("id", id)
        .eq("user_id", user.id)
        .select()
        .single();

      if (updateError) {
        if (updateError.code === "PGRST116") {
          throw createError(404, "Transaction not found");
        }
        console.error(updateError);
        throw createError(500, "Failed to update transaction");
      }

      res.json({
        success: true,
        transaction: updatedTransaction,
      });
    } catch (error: any) {
      next(error);
    }
  },
];
