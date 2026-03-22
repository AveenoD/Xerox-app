import cron from 'node-cron'
import { Order } from '../models/order.models.js'
import { v2 as cloudinary } from 'cloudinary'
import logger from './logger.js'

// Har ghante run karo — completed/rejected orders ki 24hr purani files delete karo
export const startFileExpiryCron = () => {
    cron.schedule('0 * * * *', async () => {
        try {
            const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000)

            const orders = await Order.find({
                status: { $in: ['completed', 'rejected'] },
                filePublicId: { $ne: null },
                fileDeletedAt: null,
                updatedAt: { $lt: cutoff }
            })

            if (orders.length === 0) return

            logger.info(`File expiry: ${orders.length} files to delete`)

            for (const order of orders) {
                try {
                    await cloudinary.uploader.destroy(order.filePublicId, {
                        resource_type: 'raw'
                    })
                    order.fileDeletedAt = new Date()
                    order.filePublicId = null
                    await order.save()
                    logger.info(`File deleted for order ${order._id}`)
                } catch (err) {
                    logger.error(`File delete failed for order ${order._id}:`, err.message)
                }
            }
        } catch (err) {
            logger.error('File expiry cron error:', err.message)
        }
    })

    logger.info('✅ File expiry cron started — runs every hour')
}