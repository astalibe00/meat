import { Request, Response, NextFunction } from 'express';

/**
 * Global error handling middleware
 */
export function errorHandler(err: any, req: Request, res: Response, _next: NextFunction) {
  console.error('Error:', err.message || err);

  const status = err.status || 500;
  res.status(status).json({
    error: err.message || 'Ichki server xatoligi',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}

/**
 * Async route wrapper — catches unhandled promise rejections
 */
export function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
