import { Request, Response, NextFunction } from 'express';
import { config } from '../config/env';
import { logger } from '../utils/logger';

export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Central Error Handling Middleware
 */
export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  let statusCode = 500;
  let message = 'Internal Server Error';
  let details: unknown = undefined;

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  } else if ((err as { name?: string }).name === 'MulterError') {
    // Upload limits (e.g. LIMIT_FILE_SIZE) are client errors, not server faults
    statusCode = (err as { code?: string }).code === 'LIMIT_FILE_SIZE' ? 413 : 400;
    message =
      (err as { code?: string }).code === 'LIMIT_FILE_SIZE'
        ? 'File size exceeds 5MB limit'
        : err.message;
  } else if ((err as { name?: string }).name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation Error';
    details = err.message;
  } else if ((err as { code?: number }).code === 11000) {
    statusCode = 409;
    message = 'Duplicate field value entered';
  } else if ((err as { name?: string }).name === 'CastError') {
    statusCode = 400;
    message = 'Invalid Resource ID identifier format';
  } else {
    message = err.message || message;
  }

  logger.error(`${req.method} ${req.originalUrl} - ${statusCode} - ${message}`, {
    stack: err.stack,
  });

  res.status(statusCode).json({
    success: false,
    message,
    ...(details ? { details } : {}),
    ...(!config.isProduction ? { stack: err.stack } : {}),
  });
}
