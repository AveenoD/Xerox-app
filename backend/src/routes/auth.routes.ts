import { Router } from 'express';
import {
  sendOTP,
  verifyOTP,
  register,
  login,
  refreshToken,
  logout,
  resendOTPHandler,
  getCurrentUser,
} from '../controllers/auth.controller.js';
import { validateEmailDomain } from '../middlewares/emailValidator.middleware.js';
import { verifyJWT, optionalAuth } from '../middlewares/auth.middleware.js';
import { authLimiter } from '../middlewares/rateLimiter.middleware.js';

const router = Router();

// Public routes
router.post('/send-otp', authLimiter, validateEmailDomain, sendOTP);
router.post('/verify-otp', authLimiter, verifyOTP);
router.post('/resend-otp', authLimiter, resendOTPHandler);
router.post('/register', authLimiter, validateEmailDomain, register);
router.post('/login', authLimiter, login);
router.post('/refresh-token', refreshToken);
router.post('/logout', logout);

// Protected routes
router.get('/me', verifyJWT, getCurrentUser);

export default router;
