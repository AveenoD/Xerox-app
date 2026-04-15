import { Response, NextFunction } from 'express';
import { isEmailAllowed, getBlockedDomainReason } from '../config/allowedEmailDomains.js';
import ApiError from '../utils/ApiError.js';
import { AuthRequest } from './auth.middleware.js';

// Validate email domain during registration
export const validateEmailDomain = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  const { email } = req.body;

  if (!email) {
    next(ApiError.badRequest('Email is required'));
    return;
  }

  const blockedReason = getBlockedDomainReason(email);
  if (blockedReason) {
    next(ApiError.badRequest(blockedReason));
    return;
  }

  if (!isEmailAllowed(email)) {
    next(
      ApiError.badRequest(
        `Email domain not supported. Please use Gmail, Yahoo, Outlook, or other major email providers.`
      )
    );
    return;
  }

  next();
};
