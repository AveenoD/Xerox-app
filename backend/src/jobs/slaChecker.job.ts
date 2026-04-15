import cron from 'node-cron';
import Order from '../models/order.model.js';
import VendorProfile from '../models/vendorProfile.model.js';
import { ORDER_STATUS } from '../config/constants.js';
import { logger } from '../utils/logger.js';
import orderService from '../services/order.service.js';

export const startSlaCheckerJob = (): void => {
  // Run every 30 seconds
  cron.schedule('*/30 * * * * *', async () => {
    try {
      // Find all pending orders past SLA deadline
      const expiredOrders = await Order.find({
        status: ORDER_STATUS.PENDING,
        slaDeadline: { $lt: new Date() },
        slaBreached: false,
      });

      if (expiredOrders.length === 0) return;

      logger.info(`[SLA Checker] Found ${expiredOrders.length} expired orders`);

      for (const order of expiredOrders) {
        try {
          await orderService.processSlaTimeout(order._id.toString());
          logger.info(`[SLA Checker] Processed expired order: ${order.orderId}`);
        } catch (error) {
          logger.error(`[SLA Checker] Error processing order ${order.orderId}:`, error);
        }
      }
    } catch (error) {
      logger.error('[SLA Checker] Job error:', error);
    }
  });

  logger.info('[SLA Checker] Job started - runs every 30 seconds');
};

export const stopSlaCheckerJob = (): void => {
  // In production, you would return the cron job ID and cancel it
  logger.info('[SLA Checker] Job stopped');
};
