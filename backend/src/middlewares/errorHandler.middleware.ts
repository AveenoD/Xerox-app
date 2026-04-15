import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import ApiError from '../utils/ApiError.js';
import { logger } from '../utils/logger.js';
import { SERVER_CONFIG } from '../config/constants.js';

interface ErrorResponse {
  success: false;
  message: string;
  error?: string;
  stack?: string;
}

// Global error handler
export const errorHandler = (
  err: Error | ApiError | mongoose.Error.ValidationError | mongoose.Error.CastError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let error: ApiError;

  // Default values
  let statusCode = 500;
  let message = 'Internal Server Error';
  let isOperational = true;
  let stack: string | undefined;

  // Handle ApiError
  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
    isOperational = err.isOperational;
    stack = err.stack;
  }
  // Handle Mongoose ValidationError
  else if (err instanceof mongoose.Error.ValidationError) {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(', ');
    isOperational = true;
  }
  // Handle Mongoose CastError (invalid ObjectId)
  else if (err instanceof mongoose.Error.CastError) {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
    isOperational = true;
  }
  // Handle Mongoose duplicate key error
  else if ((err as unknown as { code?: number }).code === 11000) {
    statusCode = 409;
    const field = Object.keys((err as unknown as { keyValue?: Record<string, string> }).keyValue || {})[0];
    message = field ? `${field} already exists` : 'Duplicate entry';
    isOperational = true;
  }
  // Handle SyntaxError (JSON parsing)
  else if (err instanceof SyntaxError && 'body' in err) {
    statusCode = 400;
    message = 'Invalid JSON in request body';
    isOperational = true;
  }
  // Handle unknown errors
  else {
    message = SERVER_CONFIG.NODE_ENV === 'production' ? 'Internal Server Error' : err.message;
    stack = err.stack;
  }

  // Log error
  if (statusCode >= 500) {
    logger.error('Server Error:', {
      message: err.message,
      stack: err.stack,
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
    });
  } else {
    logger.warn('Client Error:', {
      statusCode,
      message,
      url: req.originalUrl,
      method: req.method,
    });
  }

  // Send response
  const response: ErrorResponse = {
    success: false,
    message,
  };

  if (!SERVER_CONFIG.NODE_ENV || SERVER_CONFIG.NODE_ENV === 'development') {
    response.error = err.name;
    response.stack = stack;
  }

  res.status(statusCode).json(response);
};

// Handle 404
export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const error = ApiError.notFound(`Route not found: ${req.originalUrl}`);
  next(error);
};
