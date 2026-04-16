import type { NextFunction, Request, Response } from "express";
import { HttpError } from "../lib/errors";

export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export function notFoundHandler(
  _req: Request,
  _res: Response,
  next: NextFunction,
) {
  next(new HttpError(404, "Yo'l topilmadi"));
}

export function errorHandler(
  error: Error & { details?: unknown; status?: number },
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  const status = error instanceof HttpError ? error.status : error.status ?? 500;
  const details = error instanceof HttpError ? error.details : error.details;

  if (status >= 500) {
    console.error(error);
  }

  res.status(status).json({
    ...(details !== undefined ? { details } : {}),
    error: error.message || "Ichki server xatoligi",
  });
}
