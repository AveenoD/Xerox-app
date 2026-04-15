import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware.js';
import walletService from '../services/wallet.service.js';
import ApiResponse from '../utils/ApiResponse.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';

// Get wallet
export const getWallet = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw ApiError.unauthorized('Authentication required');
  }

  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;

  const wallet = await walletService.getWalletWithTransactions(
    req.user._id,
    page,
    limit
  );

  new ApiResponse(200, wallet, 'Wallet fetched').send(res);
});

// Get balance only
export const getBalance = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw ApiError.unauthorized('Authentication required');
  }

  const balance = await walletService.checkBalance(req.user._id);

  new ApiResponse(200, balance, 'Balance fetched').send(res);
});
