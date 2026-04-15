import cron from 'node-cron';
import Challenge from '../models/challenge.model.js';
import Wallet from '../models/wallet.model.js';
import { logger } from '../utils/logger.js';

export const startChallengeCheckerJob = (): void => {
  // Run every hour
  cron.schedule('0 * * * *', async () => {
    try {
      // Find expired challenges
      const expiredChallenges = await Challenge.find({
        status: 'active',
        expiresAt: { $lt: new Date() },
      });

      if (expiredChallenges.length === 0) return;

      logger.info(`[Challenge Checker] Found ${expiredChallenges.length} expired challenges`);

      for (const challenge of expiredChallenges) {
        challenge.status = 'expired';
        await challenge.save();
        logger.info(`[Challenge Checker] Expired challenge: ${challenge.challengeType} for user ${challenge.userId}`);
      }
    } catch (error) {
      logger.error('[Challenge Checker] Job error:', error);
    }
  });

  logger.info('[Challenge Checker] Job started - runs every hour');
};

export const cleanupExpiredPromoBalances = async (): Promise<void> => {
  try {
    const wallets = await Wallet.find({
      promoBalance: { $gt: 0 },
    });

    let totalCleaned = 0;

    for (const wallet of wallets) {
      const expiredAmount = await wallet.cleanupExpiredPromos();
      if (expiredAmount > 0) {
        totalCleaned += expiredAmount;
      }
    }

    if (totalCleaned > 0) {
      logger.info(`[Wallet Cleanup] Cleaned ₹${totalCleaned} expired promo balances`);
    }
  } catch (error) {
    logger.error('[Wallet Cleanup] Job error:', error);
  }
};
