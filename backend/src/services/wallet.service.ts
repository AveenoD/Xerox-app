import mongoose, { Types } from 'mongoose';
import Wallet, { IWallet } from '../models/wallet.model.js';
import { WALLET_CONFIG, PAGINATION } from '../config/constants.js';
import ApiError from '../utils/ApiError.js';
import { logger } from '../utils/logger.js';

export const walletService = {
  // Get or create wallet for user
  async getOrCreateWallet(userId: string): Promise<IWallet> {
    let wallet = await Wallet.findOne({ userId });

    if (!wallet) {
      wallet = new Wallet({
        userId: new Types.ObjectId(userId),
        balance: 0,
        promoBalance: 0,
        transactions: [],
      });
      await wallet.save();
    }

    return wallet;
  },

  // Get wallet with transactions
  async getWalletWithTransactions(
    userId: string,
    page = PAGINATION.DEFAULT_PAGE,
    limit = PAGINATION.DEFAULT_LIMIT
  ): Promise<{
    balance: number;
    promoBalance: number;
    transactions: Array<Record<string, unknown>>;
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const wallet = await this.getOrCreateWallet(userId);

    // Get transactions with pagination
    const skip = (page - 1) * limit;
    const total = wallet.transactions.length;
    const paginatedTransactions = wallet.transactions.slice(skip, skip + limit);

    return {
      balance: wallet.balance,
      promoBalance: wallet.promoBalance,
      transactions: paginatedTransactions as unknown as Array<Record<string, unknown>>,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  // Credit wallet
  async creditWallet(
    userId: string,
    amount: number,
    source: 'referral' | 'challenge' | 'spin_win' | 'signup_bonus' | 'subscription_refund',
    description: string,
    options?: {
      isPromo?: boolean;
      expiresInDays?: number;
      relatedOrderId?: string;
    }
  ): Promise<IWallet> {
    const wallet = await this.getOrCreateWallet(userId);

    await wallet.credit(
      amount,
      source,
      description,
      {
        relatedOrderId: options?.relatedOrderId
          ? new Types.ObjectId(options.relatedOrderId)
          : undefined,
        expiresAt: options?.expiresInDays
          ? new Date(Date.now() + options.expiresInDays * 24 * 60 * 60 * 1000)
          : undefined,
        isPromo: options?.isPromo ?? false,
      }
    );

    logger.info(`Credited ₹${amount} to wallet ${userId} from ${source}`);
    return wallet;
  },

  // Debit wallet (uses promo first, then real balance)
  async debitWallet(
    userId: string,
    amount: number,
    source: 'order_payment' | 'spin_cost' | 'topup',
    description: string,
    relatedOrderId?: string
  ): Promise<{ success: boolean; transaction?: Record<string, unknown> }> {
    const wallet = await this.getOrCreateWallet(userId);

    const result = await wallet.debit(
      amount,
      source,
      description,
      relatedOrderId
        ? { relatedOrderId: new Types.ObjectId(relatedOrderId) }
        : undefined
    );

    if (!result.success) {
      throw ApiError.badRequest('Insufficient balance');
    }

    logger.info(`Debited ₹${amount} from wallet ${userId} for ${source}`);
    return { success: true, transaction: result.transaction as unknown as Record<string, unknown> };
  },

  // Check balance
  async checkBalance(userId: string): Promise<{ balance: number; promoBalance: number }> {
    const wallet = await this.getOrCreateWallet(userId);
    return {
      balance: wallet.balance,
      promoBalance: wallet.promoBalance,
    };
  },

  // Process order payment
  async processOrderPayment(
    userId: string,
    amount: number,
    orderId: string
  ): Promise<{ success: boolean; paymentFrom: 'promo' | 'real' | 'both'; amount?: number }> {
    const wallet = await this.getOrCreateWallet(userId);
    const totalBalance = wallet.balance + wallet.promoBalance;

    if (totalBalance < amount) {
      throw ApiError.badRequest('Insufficient wallet balance');
    }

    let paymentFrom: 'promo' | 'real' | 'both' = 'promo';
    const promoUsed = wallet.promoBalance >= amount ? amount : wallet.promoBalance;
    if (wallet.promoBalance < amount) {
      paymentFrom = 'both';
    }

    // Deduct from wallet
    const result = await wallet.debit(
      amount,
      'order_payment',
      `Payment for order ${orderId}`,
      { relatedOrderId: new Types.ObjectId(orderId) }
    );

    if (!result.success) {
      throw ApiError.badRequest('Payment failed');
    }

    logger.info(`Order payment: ₹${amount} from wallet ${userId} (${paymentFrom})`);

    return {
      success: true,
      paymentFrom,
      amount,
    };
  },

  // Process refund
  async processRefund(
    userId: string,
    amount: number,
    orderId: string,
    source: 'order_refund' = 'order_refund'
  ): Promise<IWallet> {
    const wallet = await this.getOrCreateWallet(userId);

    // Refunds go to real balance
    await wallet.credit(amount, source, `Refund for order ${orderId}`, {
      relatedOrderId: new Types.ObjectId(orderId),
    });

    logger.info(`Refunded ₹${amount} to wallet ${userId} for order ${orderId}`);
    return wallet;
  },

  // Cleanup expired promos
  async cleanupExpiredPromos(userId: string): Promise<number> {
    const wallet = await this.getOrCreateWallet(userId);
    return wallet.cleanupExpiredPromos();
  },
};

export default walletService;
