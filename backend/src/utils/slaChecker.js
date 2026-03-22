import cron from 'node-cron'
import { Order } from '../models/order.models.js'
import VendorProfile from '../models/vendorProfile.models.js'
import { Wallet } from '../models/wallet.models.js'
import { User } from '../models/user.models.js'
import logger from './logger.js'

const SLA_MINUTES = 3 // 3 min accept window

const checkSLA = async () => {
    try {
        const cutoff = new Date(Date.now() - SLA_MINUTES * 60 * 1000)

        // 3 min se zyada pending orders
        const expiredOrders = await Order.find({
            status: 'pending',
            createdAt: { $lt: cutoff }
        })

        if (expiredOrders.length === 0) return

        logger.info(`SLA check — ${expiredOrders.length} expired order(s) found`)

        for (const order of expiredOrders) {

            // ── Auto reject order ──────────────────────
            order.status = 'rejected'
            order.cancelReason = 'sla_timeout'
            await order.save()

            // ── Refund wallet if used ──────────────────
            if (order.walletAmountUsed > 0) {
                let wallet = await Wallet.findOne({ userId: order.customerId })
                if (!wallet) wallet = await Wallet.create({ userId: order.customerId })
                await wallet.addRefundCredit(
                    order.walletAmountUsed,
                    order._id,
                    `Refund — order #${order.pickupToken} auto-cancelled (shop did not respond)`
                )
            }

            // ── Restore free pages if used ─────────────
            if (order.freePagesUsed > 0) {
                await User.findByIdAndUpdate(
                    order.customerId,
                    { $inc: { freePages: order.freePagesUsed } }
                )
            }

            // ── Strike system ──────────────────────────
            const vendor = await VendorProfile.findById(order.vendorId)
            if (vendor) {
                vendor.strikes = (vendor.strikes || 0) + 1

                if (vendor.strikes >= 7) {
                    // Permanent review
                    vendor.isOpen = false
                    vendor.suspendReason = 'permanent_review'
                    vendor.suspendedUntil = null
                    logger.warn(`Vendor ${vendor._id} permanently suspended — 7 strikes`)

                } else if (vendor.strikes >= 5) {
                    // 24hr suspend
                    vendor.isOpen = false
                    vendor.suspendedUntil = new Date(Date.now() + 24 * 60 * 60 * 1000)
                    vendor.suspendReason = '24hr_suspend'
                    logger.warn(`Vendor ${vendor._id} suspended 24hr — ${vendor.strikes} strikes`)

                } else if (vendor.strikes === 3) {
                    logger.warn(`Vendor ${vendor._id} warning — 3 strikes`)
                }

                await vendor.save()
            }

            logger.info(`Order ${order._id} auto-rejected — SLA breach — Token #${order.pickupToken}`)
        }

    } catch (err) {
        logger.error('SLA checker error:', err.message)
    }
}

// Har minute run karo
export const startSLAChecker = () => {
    cron.schedule('* * * * *', checkSLA)
    logger.info('✅ SLA checker started — runs every minute (3 min window)')
}