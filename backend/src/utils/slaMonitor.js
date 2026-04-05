import { Order } from '../models/order.models.js'
import VendorProfile from '../models/vendorProfile.models.js'
import logger from './logger.js'

// Store active SLA timers
const slaTimers = new Map()

const SLA_TIMEOUT_MS = 2 * 60 * 1000 // 2 minutes

/**
 * Start SLA monitoring for a new order
 * @param {string} orderId - Order ID
 * @param {string} vendorId - Vendor ID
 */
export const startSLAMonitoring = (orderId, vendorId) => {
    // Clear any existing timer for this order
    if (slaTimers.has(orderId)) {
        clearTimeout(slaTimers.get(orderId))
        slaTimers.delete(orderId)
    }

    // Set new timer
    const timer = setTimeout(async () => {
        await checkSLAViolation(orderId, vendorId)
    }, SLA_TIMEOUT_MS)

    slaTimers.set(orderId, timer)
    logger.info(`SLA monitoring started for order ${orderId}, vendor ${vendorId}`)
}

/**
 * Stop SLA monitoring for an order (when accepted/rejected)
 * @param {string} orderId - Order ID
 */
export const stopSLAMonitoring = (orderId) => {
    if (slaTimers.has(orderId)) {
        clearTimeout(slaTimers.get(orderId))
        slaTimers.delete(orderId)
        logger.info(`SLA monitoring stopped for order ${orderId}`)
    }
}

/**
 * Check if order violated SLA and take action
 * @param {string} orderId - Order ID
 * @param {string} vendorId - Vendor ID
 */
const checkSLAViolation = async (orderId, vendorId) => {
    try {
        // Remove timer from map
        slaTimers.delete(orderId)

        // Check order status
        const order = await Order.findById(orderId)
        if (!order) {
            logger.warn(`Order ${orderId} not found during SLA check`)
            return
        }

        // If order is still pending, it's a violation
        if (order.status === 'pending') {
            logger.warn(`SLA violation: Order ${orderId} still pending after 2 minutes`)

            // 1. Send urgent FCM notification to vendor
            await sendUrgentNotification(vendorId, orderId)

            // 2. Record strike in vendor profile
            await recordVendorStrike(vendorId, orderId)

            // 3. Optionally notify customer about delay
            await notifyCustomerOfDelay(order.customerId, orderId)
        }
    } catch (error) {
        logger.error(`SLA check failed for order ${orderId}:`, error)
    }
}

/**
 * Send urgent FCM notification to vendor
 * @param {string} vendorId - Vendor ID
 * @param {string} orderId - Order ID
 */
const sendUrgentNotification = async (vendorId, orderId) => {
    try {
        // Get vendor's user ID and FCM token
        const vendor = await VendorProfile.findById(vendorId).populate('userId')
        if (!vendor || !vendor.userId) {
            logger.warn(`Vendor ${vendorId} not found for SLA notification`)
            return
        }

        const fcmToken = vendor.userId.fcmToken
        if (!fcmToken) {
            logger.warn(`No FCM token for vendor ${vendorId}`)
            return
        }

        // Prepare notification payload
        const notification = {
            token: fcmToken,
            title: 'URGENT: Accept order now! ⚠️',
            body: `Order #${orderId.slice(-4)} has been pending for 2 minutes. Accept immediately to avoid penalty!`,
            data: {
                orderId: orderId.toString(),
                type: 'sla_violation',
                priority: 'high'
            },
            android: {
                priority: 'high',
                notification: {
                    channelId: 'urgent_orders',
                    sound: 'alarm',
                    vibrateTimings: ['1s', '2s', '1s']
                }
            },
            apns: {
                payload: {
                    aps: {
                        alert: {
                            title: 'URGENT: Accept order now! ⚠️',
                            body: `Order #${orderId.slice(-4)} has been pending for 2 minutes. Accept immediately to avoid penalty!`
                        },
                        sound: 'alarm.caf',
                        badge: 1,
                        category: 'URGENT_ORDER'
                    }
                }
            }
        }

        // Send notification (implementation depends on your FCM service)
        await sendFCMNotification(notification)
        
        logger.info(`Urgent SLA notification sent to vendor ${vendorId} for order ${orderId}`)
    } catch (error) {
        logger.error(`Failed to send SLA notification to vendor ${vendorId}:`, error)
    }
}

/**
 * Record a strike in vendor profile
 * @param {string} vendorId - Vendor ID
 * @param {string} orderId - Order ID
 */
const recordVendorStrike = async (vendorId, orderId) => {
    try {
        const vendor = await VendorProfile.findById(vendorId)
        if (!vendor) {
            logger.warn(`Vendor ${vendorId} not found for strike recording`)
            return
        }

        // Initialize strikes array if not exists
        if (!vendor.strikes) {
            vendor.strikes = []
        }

        // Add new strike
        vendor.strikes.push({
            reason: 'Slow Response',
            description: `Order ${orderId} not accepted within 2 minutes`,
            orderId: orderId,
            createdAt: new Date()
        })

        // Increment strike count
        vendor.strikeCount = (vendor.strikeCount || 0) + 1

        await vendor.save()
        logger.info(`Strike recorded for vendor ${vendorId}, total strikes: ${vendor.strikeCount}`)

        // Check if vendor should be suspended (e.g., 3 strikes)
        if (vendor.strikeCount >= 3) {
            await suspendVendor(vendorId)
        }
    } catch (error) {
        logger.error(`Failed to record strike for vendor ${vendorId}:`, error)
    }
}

/**
 * Suspend vendor after too many strikes
 * @param {string} vendorId - Vendor ID
 */
const suspendVendor = async (vendorId) => {
    try {
        await VendorProfile.findByIdAndUpdate(vendorId, {
            isOpen: false,
            suspendedUntil: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
            suspendReason: 'Multiple SLA violations (3+ strikes)'
        })
        logger.warn(`Vendor ${vendorId} suspended due to multiple SLA violations`)
    } catch (error) {
        logger.error(`Failed to suspend vendor ${vendorId}:`, error)
    }
}

/**
 * Notify customer about order delay
 * @param {string} customerId - Customer ID
 * @param {string} orderId - Order ID
 */
const notifyCustomerOfDelay = async (customerId, orderId) => {
    try {
        // Implementation depends on your notification service
        logger.info(`Delay notification would be sent to customer ${customerId} for order ${orderId}`)
    } catch (error) {
        logger.error(`Failed to notify customer ${customerId}:`, error)
    }
}

/**
 * Send FCM notification
 * @param {Object} notification - FCM notification payload
 */
const sendFCMNotification = async (notification) => {
    // This is a placeholder - implement with your actual FCM service
    // Example using firebase-admin:
    // await admin.messaging().send(notification)
    
    logger.info(`FCM notification prepared: ${JSON.stringify(notification)}`)
}

/**
 * Get active SLA monitors count
 * @returns {number} Count of active monitors
 */
export const getActiveSLACount = () => {
    return slaTimers.size
}

/**
 * Clear all SLA monitors (useful for testing or shutdown)
 */
export const clearAllSLAMonitors = () => {
    for (const [orderId, timer] of slaTimers) {
        clearTimeout(timer)
        logger.info(`Cleared SLA monitor for order ${orderId}`)
    }
    slaTimers.clear()
}

export default {
    startSLAMonitoring,
    stopSLAMonitoring,
    getActiveSLACount,
    clearAllSLAMonitors
}
