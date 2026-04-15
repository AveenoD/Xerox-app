import { Response } from 'express';
import authService from '../services/auth.service.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';
import User from '../models/user.model.js';
import { logger } from '../utils/logger.js';

// Send OTP to email
export const sendOTP = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { email } = req.body;

  const result = await authService.sendEmailOTP(email);

  new ApiResponse(200, result, 'OTP sent successfully').send(res);
});

// Verify OTP
export const verifyOTP = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { email, otp } = req.body;

  const result = await authService.verifyEmailOTP(email, otp);

  new ApiResponse(200, result, 'OTP verified').send(res);
});

// Register
export const register = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { email, password, fullName, phone, referralCode } = req.body;

  const result = await authService.register(email, password, fullName, phone, referralCode);

  // Set cookies
  res.cookie('accessToken', result.accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 15 * 60 * 1000, // 15 minutes
  });

  res.cookie('refreshToken', result.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  new ApiResponse(201, result, 'Registration successful').send(res);
});

// Login
export const login = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { email, password } = req.body;

  const result = await authService.login(email, password);

  // Set cookies
  res.cookie('accessToken', result.accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 15 * 60 * 1000,
  });

  res.cookie('refreshToken', result.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  new ApiResponse(200, result, 'Login successful').send(res);
});

// Refresh token
export const refreshToken = asyncHandler(async (req: AuthRequest, res: Response) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    throw (await import('../utils/ApiError.js')).default.unauthorized('Refresh token required');
  }

  const result = await authService.refreshAccessToken(refreshToken);

  // Update cookies
  res.cookie('accessToken', result.accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 15 * 60 * 1000,
  });

  res.cookie('refreshToken', result.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  new ApiResponse(200, result, 'Token refreshed').send(res);
});

// Logout
export const logout = asyncHandler(async (req: AuthRequest, res: Response) => {
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');

  new ApiResponse(200, null, 'Logged out successfully').send(res);
});

// Resend OTP
export const resendOTPHandler = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { email } = req.body;

  const result = await authService.resendOTP(email);

  new ApiResponse(200, result, 'OTP resent').send(res);
});

// Get current user
export const getCurrentUser = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw ApiError.unauthorized('Not authenticated');
  }

  const user = await User.findById(req.user._id);

  if (!user) {
    throw ApiError.notFound('User not found');
  }

  new ApiResponse(200, {
    _id: user._id,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    role: user.role,
    referralCode: user.referralCode,
  }, 'User fetched').send(res);
});
