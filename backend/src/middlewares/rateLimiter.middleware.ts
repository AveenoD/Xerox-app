import rateLimit from 'express-rate-limit';
import { RATE_LIMIT } from '../config/constants.js';
import ApiError from '../utils/ApiError.js';

// General API rate limiter
export const apiLimiter = rateLimit({
  windowMs: RATE_LIMIT.API.windowMs,
  max: RATE_LIMIT.API.max,
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    next(ApiError.tooManyRequests('Too many requests, please try again later'));
  },
});

// Auth routes rate limiter (stricter)
export const authLimiter = rateLimit({
  windowMs: RATE_LIMIT.AUTH.windowMs,
  max: RATE_LIMIT.AUTH.max,
  message: 'Too many authentication attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    next(ApiError.tooManyRequests('Too many authentication attempts, please try again later'));
  },
});

// Order routes rate limiter
export const orderLimiter = rateLimit({
  windowMs: RATE_LIMIT.ORDER.windowMs,
  max: RATE_LIMIT.ORDER.max,
  message: 'Too many order requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    next(ApiError.tooManyRequests('Too many order requests, please try again later'));
  },
});
