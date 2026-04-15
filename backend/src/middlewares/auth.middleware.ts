import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_CONFIG, USER_ROLES } from '../config/constants.js';
import ApiError from '../utils/ApiError.js';
import User from '../models/user.model.js';

export interface AuthRequest extends Request {
  user?: {
    _id: string;
    email: string;
    role: string;
  };
}

// Verify JWT token
export const verifyJWT = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      throw ApiError.unauthorized('Access token required');
    }

    const decoded = jwt.verify(token, JWT_CONFIG.ACCESS_TOKEN_SECRET) as {
      _id: string;
      email: string;
      role: string;
    };

    const user = await User.findById(decoded._id);
    if (!user || !user.isActive) {
      throw ApiError.unauthorized('User not found or inactive');
    }

    req.user = {
      _id: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      next(ApiError.unauthorized('Token expired'));
    } else if (error instanceof jwt.JsonWebTokenError) {
      next(ApiError.unauthorized('Invalid token'));
    } else {
      next(error);
    }
  }
};

// Optional auth - doesn't fail if no token
export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.headers.authorization?.replace('Bearer ', '');

    if (token) {
      const decoded = jwt.verify(token, JWT_CONFIG.ACCESS_TOKEN_SECRET) as {
        _id: string;
        email: string;
        role: string;
      };

      const user = await User.findById(decoded._id);
      if (user && user.isActive) {
        req.user = {
          _id: user._id.toString(),
          email: user.email,
          role: user.role,
        };
      }
    }
    next();
  } catch {
    // Continue without user
    next();
  }
};

// Require specific role
export const requireRole = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(ApiError.unauthorized('Authentication required'));
      return;
    }

    if (!roles.includes(req.user.role)) {
      next(ApiError.forbidden(`Access denied. Required role: ${roles.join(' or ')}`));
      return;
    }

    next();
  };
};

// Shortcut middlewares
export const requireUser = requireRole(USER_ROLES.USER, USER_ROLES.VENDOR, USER_ROLES.ADMIN);
export const requireVendor = requireRole(USER_ROLES.VENDOR, USER_ROLES.ADMIN);
export const requireAdmin = requireRole(USER_ROLES.ADMIN);
