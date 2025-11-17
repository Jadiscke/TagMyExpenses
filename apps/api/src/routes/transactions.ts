import { Request, Response, NextFunction } from "express";
import createError from "http-errors";
import { supabase } from "../config/supabase.js";
import { authenticateUser } from "../middleware/auth.js";

export const getTransactions = [
  authenticateUser,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;

      // Parse query parameters
      const page = Number(req.query.page) || 1;
      const pageSize = Number(req.query.pageSize) || 20;
      const offset = (page - 1) * pageSize;
      const search = req.query.search as string | undefined;
      const category = req.query.category as string | undefined;

      // Build base query for counting and filtering
      let countQuery = supabase
        .from("transactions")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      // Build query for fetching data (paginated)
      let dataQuery = supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: false })
        .range(offset, offset + pageSize - 1);

      // Build query for calculating total amount (all filtered transactions)
      let sumQuery = supabase
        .from("transactions")
        .select("amount")
        .eq("user_id", user.id);

      // Apply search filter (searches in merchant, raw_description, and category)
      if (search && search.trim()) {
        const searchPattern = search.trim();
        // Supabase OR syntax: column1.ilike.*pattern*,column2.ilike.*pattern*
        const searchFilter = `merchant.ilike.%${searchPattern}%,raw_description.ilike.%${searchPattern}%,category.ilike.%${searchPattern}%`;
        countQuery = countQuery.or(searchFilter);
        dataQuery = dataQuery.or(searchFilter);
        sumQuery = sumQuery.or(searchFilter);
      }

      // Apply category filter
      if (category && category.trim()) {
        countQuery = countQuery.eq("category", category.trim());
        dataQuery = dataQuery.eq("category", category.trim());
        sumQuery = sumQuery.eq("category", category.trim());
      }

      // Apply other filters
      if (req.query.merchant && typeof req.query.merchant === "string") {
        countQuery = countQuery.ilike("merchant", `%${req.query.merchant}%`);
        dataQuery = dataQuery.ilike("merchant", `%${req.query.merchant}%`);
        sumQuery = sumQuery.ilike("merchant", `%${req.query.merchant}%`);
      }

      if (req.query.startDate && typeof req.query.startDate === "string") {
        countQuery = countQuery.gte("date", req.query.startDate);
        dataQuery = dataQuery.gte("date", req.query.startDate);
        sumQuery = sumQuery.gte("date", req.query.startDate);
      }

      if (req.query.endDate && typeof req.query.endDate === "string") {
        countQuery = countQuery.lte("date", req.query.endDate);
        dataQuery = dataQuery.lte("date", req.query.endDate);
        sumQuery = sumQuery.lte("date", req.query.endDate);
      }

      // Execute queries in parallel
      const [countResult, dataResult, sumResult] = await Promise.all([
        countQuery,
        dataQuery,
        sumQuery,
      ]);

      if (countResult.error) {
        console.error(countResult.error);
        throw createError(500, "Failed to fetch transaction count");
      }

      if (dataResult.error) {
        console.error(dataResult.error);
        throw createError(500, "Failed to fetch transactions");
      }

      if (sumResult.error) {
        console.error(sumResult.error);
        throw createError(500, "Failed to calculate total amount");
      }

      const transactions = dataResult.data || [];
      const total = countResult.count || 0;

      // Calculate total amount of ALL filtered transactions (not just current page)
      const sumData = (sumResult.data || []) as Array<{ amount: number }>;
      const totalAmount = sumData.reduce((sum, t) => sum + (t.amount || 0), 0);

      res.json({
        transactions,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
        totalAmount,
      });
    } catch (error: any) {
      next(error);
    }
  },
];
