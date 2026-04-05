import { VendorPlan } from '../models/vendorPlan.models.js'
import { ApiError } from '../utils/ApiError.js'
import logger from '../utils/logger.js'

/**
 * Middleware to check if vendor has reached their plan limit
 * before accepting a new order
 */
export const checkPlanLimit = async (req, res, next) => {
    try {
        // Only check for vendor operations
        if (req.user.role !== 'vendor') {
            return next()
        }

        // Get vendor profile ID
        const vendorProfileId = req.user.vendorProfileId
        if (!vendorProfileId) {
            throw new ApiError(403, 'Vendor profile not found')
        }

        // Find vendor plan
        const vendorPlan = await VendorPlan.findOne({ vendorId: vendorProfileId })

        // If no plan exists, create a starter plan
        if (!vendorPlan) {
            const newPlan = await VendorPlan.createForVendor(vendorProfileId, 'starter')
            logger.info(`Created starter plan for vendor ${vendorProfileId}`)
            
            // Check if the new plan has reached limit (should be 0/30)
            if (newPlan.isLimitReached()) {
                throw new ApiError(403, 'Upgrade to accept more orders.')
            }
            
            // Attach plan to request for later use
            req.vendorPlan = newPlan
            return next()
        }

        // Check if plan is active
        if (vendorPlan.status !== 'active') {
            throw new ApiError(403, 'Your subscription is not active. Please renew your plan.')
        }

        // Check if monthly period has ended and reset if needed
        const now = new Date()
        if (now > vendorPlan.currentPeriodEnd) {
            await vendorPlan.resetMonthlyCounter()
            logger.info(`Reset monthly counter for vendor ${vendorProfileId}`)
        }

        // Check if plan limit is reached
        if (vendorPlan.isLimitReached()) {
            const limit = vendorPlan.plan === 'starter' ? 30 : 200
            logger.warn(`Vendor ${vendorProfileId} reached plan limit: ${vendorPlan.ordersUsedThisMonth}/${limit}`)
            
            throw new ApiError(403, 
                `Upgrade to accept more orders. ` +
                `You have used ${vendorPlan.ordersUsedThisMonth} orders this month. ` +
                `Current plan: ${vendorPlan.plan.toUpperCase()}`
            )
        }

        // Attach plan to request for later use (e.g., incrementing after successful accept)
        req.vendorPlan = vendorPlan
        
        logger.info(`Plan check passed for vendor ${vendorProfileId}: ${vendorPlan.ordersUsedThisMonth} orders used`)
        next()
    } catch (error) {
        if (error instanceof ApiError) {
            return res.status(error.statusCode).json({
                statusCode: error.statusCode,
                message: error.message,
                errors: error.errors
            })
        }
        
        logger.error('Plan check middleware error:', error)
        return res.status(500).json({
            statusCode: 500,
            message: 'Internal server error during plan check'
        })
    }
}

/**
 * Middleware to increment order count after successful order acceptance
 * Use this after the order is successfully accepted
 */
export const incrementOrderCount = async (req, res, next) => {
    try {
        if (req.vendorPlan && req.orderAccepted) {
            await req.vendorPlan.incrementOrderCount()
            logger.info(`Incremented order count for vendor ${req.vendorPlan.vendorId}`)
        }
        next()
    } catch (error) {
        logger.error('Failed to increment order count:', error)
        // Don't block the response, just log the error
        next()
    }
}

/**
 * Get vendor plan details
 * Utility middleware to attach plan info to request
 */
export const attachVendorPlan = async (req, res, next) => {
    try {
        if (req.user.role !== 'vendor') {
            return next()
        }

        const vendorProfileId = req.user.vendorProfileId
        if (!vendorProfileId) {
            return next()
        }

        const vendorPlan = await VendorPlan.findOne({ vendorId: vendorProfileId })
        
        if (vendorPlan) {
            // Check if period needs reset
            const now = new Date()
            if (now > vendorPlan.currentPeriodEnd) {
                await vendorPlan.resetMonthlyCounter()
            }
            req.vendorPlan = vendorPlan
        }

        next()
    } catch (error) {
        logger.error('Attach vendor plan error:', error)
        next()
    }
}

export default {
    checkPlanLimit,
    incrementOrderCount,
    attachVendorPlan
}
