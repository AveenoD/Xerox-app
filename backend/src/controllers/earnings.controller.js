import mongoose from 'mongoose'
import { Order } from '../models/order.models.js'
import VendorProfile from '../models/vendorProfile.models.js'
import { ApiError } from '../utils/ApiError.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import asyncHandler from '../utils/asyncHandler.js'
import logger from '../utils/logger.js'

// ── Get Vendor Earnings Dashboard ─────────────────────
export const getEarningsDashboard = asyncHandler(async (req, res) => {
    const vendor = await VendorProfile.findOne({ userId: req.user._id })
    if (!vendor) throw new ApiError(404, "Vendor not found")

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const weekAgo = new Date(today)
    weekAgo.setDate(weekAgo.getDate() - 7)
    
    const monthAgo = new Date(today)
    monthAgo.setDate(monthAgo.getDate() - 30)

    // Today's earnings
    const todayEarnings = await Order.aggregate([
        {
            $match: {
                vendorId: vendor._id,
                status: 'completed',
                updatedAt: { $gte: today }
            }
        },
        {
            $group: {
                _id: null,
                total: { $sum: '$totalAmount' },
                orders: { $sum: 1 }
            }
        }
    ])

    // This week's earnings
    const weekEarnings = await Order.aggregate([
        {
            $match: {
                vendorId: vendor._id,
                status: 'completed',
                updatedAt: { $gte: weekAgo }
            }
        },
        {
            $group: {
                _id: null,
                total: { $sum: '$totalAmount' },
                orders: { $sum: 1 }
            }
        }
    ])

    // This month's earnings
    const monthEarnings = await Order.aggregate([
        {
            $match: {
                vendorId: vendor._id,
                status: 'completed',
                updatedAt: { $gte: monthAgo }
            }
        },
        {
            $group: {
                _id: null,
                total: { $sum: '$totalAmount' },
                orders: { $sum: 1 }
            }
        }
    ])

    // All-time earnings
    const allTimeEarnings = await Order.aggregate([
        {
            $match: {
                vendorId: vendor._id,
                status: 'completed'
            }
        },
        {
            $group: {
                _id: null,
                total: { $sum: '$totalAmount' },
                orders: { $sum: 1 }
            }
        }
    ])

    // Daily breakdown for last 7 days
    const dailyBreakdown = await Order.aggregate([
        {
            $match: {
                vendorId: vendor._id,
                status: 'completed',
                updatedAt: { $gte: weekAgo }
            }
        },
        {
            $group: {
                _id: {
                    $dateToString: { format: '%Y-%m-%d', date: '$updatedAt' }
                },
                earnings: { $sum: '$totalAmount' },
                orders: { $sum: 1 }
            }
        },
        { $sort: { _id: 1 } }
    ])

    // Order status counts
    const orderStats = await Order.aggregate([
        {
            $match: {
                vendorId: vendor._id
            }
        },
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 }
            }
        }
    ])

    // Recent completed orders
    const recentOrders = await Order.find({
        vendorId: vendor._id,
        status: 'completed'
    })
    .sort({ updatedAt: -1 })
    .limit(10)
    .select('pickupToken totalAmount updatedAt')

    const stats = {
        today: {
            earnings: todayEarnings[0]?.total || 0,
            orders: todayEarnings[0]?.orders || 0
        },
        thisWeek: {
            earnings: weekEarnings[0]?.total || 0,
            orders: weekEarnings[0]?.orders || 0
        },
        thisMonth: {
            earnings: monthEarnings[0]?.total || 0,
            orders: monthEarnings[0]?.orders || 0
        },
        allTime: {
            earnings: allTimeEarnings[0]?.total || 0,
            orders: allTimeEarnings[0]?.orders || 0
        },
        dailyBreakdown,
        orderStats: orderStats.reduce((acc, stat) => {
            acc[stat._id] = stat.count
            return acc
        }, {}),
        recentOrders
    }

    logger.info(`Earnings dashboard fetched for vendor ${vendor._id}`)

    return res.status(200).json(
        new ApiResponse(200, stats, "Earnings dashboard fetched successfully")
    )
})

// ── Get Earnings by Date Range ────────────────────────
export const getEarningsByDateRange = asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query
    
    if (!startDate || !endDate) {
        throw new ApiError(400, "Start date and end date are required")
    }

    const vendor = await VendorProfile.findOne({ userId: req.user._id })
    if (!vendor) throw new ApiError(404, "Vendor not found")

    const start = new Date(startDate)
    const end = new Date(endDate)
    end.setHours(23, 59, 59, 999)

    const earnings = await Order.aggregate([
        {
            $match: {
                vendorId: vendor._id,
                status: 'completed',
                updatedAt: { $gte: start, $lte: end }
            }
        },
        {
            $group: {
                _id: {
                    $dateToString: { format: '%Y-%m-%d', date: '$updatedAt' }
                },
                earnings: { $sum: '$totalAmount' },
                orders: { $sum: 1 }
            }
        },
        { $sort: { _id: 1 } }
    ])

    const total = earnings.reduce((sum, day) => sum + day.earnings, 0)
    const totalOrders = earnings.reduce((sum, day) => sum + day.orders, 0)

    return res.status(200).json(
        new ApiResponse(200, {
            total,
            totalOrders,
            breakdown: earnings
        }, "Earnings by date range fetched successfully")
    )
})

// ── Request Payout ────────────────────────────────────
export const requestPayout = asyncHandler(async (req, res) => {
    const { amount, upiId } = req.body

    if (!amount || amount < 100) {
        throw new ApiError(400, "Minimum payout amount is ₹100")
    }

    if (!upiId) {
        throw new ApiError(400, "UPI ID is required")
    }

    const vendor = await VendorProfile.findOne({ userId: req.user._id })
    if (!vendor) throw new ApiError(404, "Vendor not found")

    // Calculate available balance (completed orders - already paid out)
    const totalEarnings = await Order.aggregate([
        {
            $match: {
                vendorId: vendor._id,
                status: 'completed'
            }
        },
        {
            $group: {
                _id: null,
                total: { $sum: '$totalAmount' }
            }
        }
    ])

    // TODO: Subtract already paid out amount from database
    const availableBalance = totalEarnings[0]?.total || 0

    if (amount > availableBalance) {
        throw new ApiError(400, `Insufficient balance. Available: ₹${availableBalance}`)
    }

    // TODO: Create payout record and process
    // This would integrate with a payment gateway

    logger.info(`Payout requested: ${req.user._id} — ₹${amount} to ${upiId}`)

    return res.status(200).json(
        new ApiResponse(200, {
            amount,
            upiId,
            status: 'pending',
            message: 'Payout request submitted. You will receive the amount within 24-48 hours.'
        }, "Payout requested successfully")
    )
})

export default {
    getEarningsDashboard,
    getEarningsByDateRange,
    requestPayout
}
