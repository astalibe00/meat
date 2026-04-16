import cors from "cors";
import express from "express";
import { env } from "./lib/env";
import { errorHandler, notFoundHandler } from "./middleware/error";
import adminRouter from "./routes/admin";
import cartRouter from "./routes/cart";
import categoriesRouter from "./routes/categories";
import meRouter from "./routes/me";
import ordersRouter from "./routes/orders";
import productsRouter from "./routes/products";
import uploadRouter from "./routes/upload";

const app = express();
const allowedOrigins = new Set(
  [
    env.allowedOrigin,
    "http://127.0.0.1:5173",
    "http://localhost:5173",
  ].filter(Boolean),
);

app.use(
  cors({
    allowedHeaders: ["Authorization", "Content-Type"],
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    origin(origin, callback) {
      if (!origin || !env.isProduction || allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("CORS blocked"));
    },
  }),
);
app.use(express.json({ limit: "10mb" }));

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/categories", categoriesRouter);
app.use("/api/products", productsRouter);
app.use("/api/cart", cartRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/me", meRouter);
app.use("/api/admin", adminRouter);
app.use("/api/admin/upload", uploadRouter);
app.use("/api/upload", uploadRouter);

app.use(notFoundHandler);
app.use(errorHandler);

const port = Number.parseInt(process.env.PORT ?? "3001", 10);

if (!env.isProduction) {
  app.listen(port, () => {
    console.log(`API server running on http://localhost:${port}`);
  });
}

export default app;
