import { Response, NextFunction } from 'express';
import ApiError from '../utils/ApiError.js';
import User from '../models/user.model.js';
import { AuthRequest } from './auth.middleware.js';

// Verify admin role
export const verifyAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw ApiError.unauthorized('Authentication required');
    }

    if (req.user.role !== 'admin') {
      throw ApiError.forbidden('Admin access required');
    }

    const admin = await User.findById(req.user._id);
    if (!admin || !admin.isActive) {
      throw ApiError.unauthorized('Admin not found');
    }

    next();
  } catch (error) {
    next(error);
  }
};
