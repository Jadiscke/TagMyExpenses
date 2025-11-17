import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { errorHandler } from "./middleware/errorHandler.js";
import { routes } from "./routes/index.js";

// Load environment variables from .env.local first, then .env
dotenv.config({ path: ".env.local" });
dotenv.config();

const app = express();
const port = Number(process.env.PORT) || 3000;
const host = process.env.HOST || "0.0.0.0";

// Middleware
app.use(cors({ origin: true, credentials: true }));
// Increase JSON body size limit to 15MB to accommodate base64-encoded files
// (base64 increases size by ~33%, so 10MB file becomes ~13.3MB)
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// Routes
app.use(routes);

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({ error: "Route not found", status: 404 });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
app.listen(port, host, () => {
  console.log(`🚀 Server running on http://${host}:${port}`);
});
