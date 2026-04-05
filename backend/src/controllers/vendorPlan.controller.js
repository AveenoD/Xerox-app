import { VendorPlan, PLAN_LIMITS } from '../models/vendorPlan.models.js'
import VendorProfile from '../models/vendorProfile.models.js'
import { ApiError } from '../utils/ApiError.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import asyncHandler from '../utils/asyncHandler.js'
import logger from '../utils/logger.js'

// ── Get My Plan ───────────────────────────────────────
export const getMyPlan = asyncHandler(async (req, res) => {
    if (req.user.role !== 'vendor') {
        throw new ApiError(403, 'Only vendors can access plan information')
    }

    const vendor = await VendorProfile.findOne({ userId: req.user._id })
    if (!vendor) {
        throw new ApiError(404, 'Vendor profile not found')
    }

    let plan = await VendorPlan.findOne({ vendorId: vendor._id })

    // Create starter plan if doesn't exist
    if (!plan) {
        plan = await VendorPlan.createForVendor(vendor._id, 'starter')
        logger.info(`Created starter plan for vendor ${vendor._id}`)
    }

    // Check if period needs reset
    const now = new Date()
    if (now > plan.currentPeriodEnd) {
        await plan.resetMonthlyCounter()
    }

    const remainingOrders = plan.getRemainingOrders()
    const limit = PLAN_LIMITS[plan.plan]

    return res.status(200).json(
        new ApiResponse(200, {
            plan: plan.plan,
            status: plan.status,
            ordersUsedThisMonth: plan.ordersUsedThisMonth,
            ordersLimit: limit === Infinity ? 'Unlimited' : limit,
            remainingOrders,
            currentPeriodStart: plan.currentPeriodStart,
            currentPeriodEnd: plan.currentPeriodEnd,
            monthlyOrderHistory: plan.monthlyOrderHistory.slice(-6) // Last 6 months
        }, 'Vendor plan retrieved successfully')
    )
})

// ── Upgrade Plan ──────────────────────────────────────
export const upgradePlan = asyncHandler(async (req, res) => {
    if (req.user.role !== 'vendor') {
        throw new ApiError(403, 'Only vendors can upgrade plans')
    }

    const { plan: newPlan } = req.body
    const validPlans = ['starter', 'growth', 'pro']

    if (!validPlans.includes(newPlan)) {
        throw new ApiError(400, 'Invalid plan. Choose from: starter, growth, pro')
    }

    const vendor = await VendorProfile.findOne({ userId: req.user._id })
    if (!vendor) {
        throw new ApiError(404, 'Vendor profile not found')
    }

    let vendorPlan = await VendorPlan.findOne({ vendorId: vendor._id })

    if (!vendorPlan) {
        vendorPlan = await VendorPlan.createForVendor(vendor._id, newPlan)
    } else {
        // Update plan
        vendorPlan.plan = newPlan
        vendorPlan.status = 'active'
        await vendorPlan.save()
    }

    logger.info(`Vendor ${vendor._id} upgraded to ${newPlan} plan`)

    return res.status(200).json(
        new ApiResponse(200, {
            plan: vendorPlan.plan,
            status: vendorPlan.status,
            ordersUsedThisMonth: vendorPlan.ordersUsedThisMonth,
            remainingOrders: vendorPlan.getRemainingOrders()
        }, `Plan upgraded to ${newPlan} successfully`)
    )
})

// ── Admin: Get All Plans ──────────────────────────────
export const getAllPlans = asyncHandler(async (req, res) => {
    if (req.user.role !== 'admin') {
        throw new ApiError(403, 'Only admins can view all plans')
    }

    const plans = await VendorPlan.find()
        .populate('vendorId', 'shopName userId')
        .sort({ createdAt: -1 })

    return res.status(200).json(
        new ApiResponse(200, plans, 'All vendor plans retrieved')
    )
})

// ── Admin: Update Vendor Plan ─────────────────────────
export const adminUpdatePlan = asyncHandler(async (req, res) => {
    if (req.user.role !== 'admin') {
        throw new ApiError(403, 'Only admins can update plans')
    }

    const { vendorId } = req.params
    const { plan, status } = req.body

    const vendorPlan = await VendorPlan.findOne({ vendorId })
    if (!vendorPlan) {
        throw new ApiError(404, 'Vendor plan not found')
    }

    if (plan) vendorPlan.plan = plan
    if (status) vendorPlan.status = status

    await vendorPlan.save()

    logger.info(`Admin updated plan for vendor ${vendorId}: ${plan || 'no change'}, ${status || 'no change'}`)

    return res.status(200).json(
        new ApiResponse(200, vendorPlan, 'Vendor plan updated successfully')
    )
})

// ── Get Plan Limits ───────────────────────────────────
export const getPlanLimits = asyncHandler(async (req, res) => {
    return res.status(200).json(
        new ApiResponse(200, {
            starter: 30,
            growth: 200,
            pro: 'Unlimited'
        }, 'Plan limits retrieved')
    )
})

export default {
    getMyPlan,
    upgradePlan,
    getAllPlans,
    adminUpdatePlan,
    getPlanLimits
}
