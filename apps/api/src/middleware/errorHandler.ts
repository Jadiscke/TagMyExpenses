import { Request, Response, NextFunction } from "express";
import createError from "http-errors";

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // If response already sent, delegate to default Express error handler
  if (res.headersSent) {
    return next(err);
  }

  // Log error
  console.error("Error:", err);

  // Handle http-errors
  if (err.statusCode || err.status) {
    const status = err.statusCode || err.status || 500;
    return res.status(status).json({
      error: err.message || "Internal server error",
      status,
    });
  }

  // Default to 500
  res.status(500).json({
    error: err.message || "Internal server error",
    status: 500,
  });
}

