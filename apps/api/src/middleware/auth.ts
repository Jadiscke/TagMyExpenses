import { Request, Response, NextFunction } from "express";
import createError from "http-errors";
import { supabase } from "../config/supabase.js";

export async function authenticateUser(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw createError(401, "Missing or invalid authorization header");
    }

    const token = authHeader.replace("Bearer ", "");

    // Validate token with Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError) {
      console.error("Auth error:", authError);
      console.error("Token (first 20 chars):", token.substring(0, 20));
      throw createError(401, `Invalid token: ${authError.message || "Authentication failed"}`);
    }

    if (!user) {
      console.error("No user returned from token validation");
      throw createError(401, "Invalid token: No user found");
    }

    // Attach user to request
    (req as any).user = user;
    next();
  } catch (error: any) {
    // If it's already an http-error, pass it through
    if (error.statusCode || error.status) {
      return next(error);
    }
    // Otherwise wrap it
    next(error);
  }
}

