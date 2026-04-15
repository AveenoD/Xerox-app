import cron from 'node-cron';
import Order from '../models/order.model.js';
import { ORDER_STATUS, FILE_CONFIG } from '../config/constants.js';
import { logger } from '../utils/logger.js';

export const startFileExpiryJob = (): void => {
  // Run every hour
  cron.schedule('0 * * * *', async () => {
    try {
      // Find orders with files past expiry date
      const expiredOrders = await Order.find({
        fileDeleteAt: { $lt: new Date() },
        keepForFuture: false,
        status: { $in: [ORDER_STATUS.COMPLETED, ORDER_STATUS.REJECTED, ORDER_STATUS.CANCELLED] },
      });

      if (expiredOrders.length === 0) return;

      logger.info(`[File Expiry] Found ${expiredOrders.length} files to delete`);

      for (const order of expiredOrders) {
        try {
          // In production, you would:
          // 1. Delete file from Cloudinary
          // 2. Delete preview from Cloudinary
          // 3. Update order to mark file as deleted

          // For now, just log
          logger.info(`[File Expiry] Would delete file for order: ${order.orderId}`);

          // Optionally update the order
          order.fileUrl = ''; // Clear URLs
          order.previewUrl = '';
          await order.save();
        } catch (error) {
          logger.error(`[File Expiry] Error processing order ${order.orderId}:`, error);
        }
      }
    } catch (error) {
      logger.error('[File Expiry] Job error:', error);
    }
  });

  logger.info('[File Expiry] Job started - runs every hour');
};

export const extendKeepForFutureFiles = async (): Promise<void> => {
  // Find files that were marked "keep" and extend expiry
  const filesToExtend = await Order.find({
    keepForFuture: true,
    fileDeleteAt: {
      $lt: new Date(Date.now() + FILE_CONFIG.FILE_EXPIRY_HOURS * 60 * 60 * 1000),
    },
  });

  for (const order of filesToExtend) {
    // Extend to 7 days from now
    order.fileDeleteAt = new Date(Date.now() + FILE_CONFIG.FILE_KEEP_HOURS * 60 * 60 * 1000);
    await order.save();
  }

  logger.info(`[File Expiry] Extended ${filesToExtend.length} files`);
};
