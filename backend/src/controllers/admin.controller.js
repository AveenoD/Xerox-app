import { User } from '../models/user.models.js'
import VendorProfile from '../models/vendorProfile.models.js'
import { Order } from '../models/order.models.js'
import { Dispute } from '../models/dispute.models.js'
import { Wallet } from '../models/wallet.models.js'
import { VendorPlan } from '../models/vendorPlan.models.js'
import { ApiError } from '../utils/ApiError.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import asyncHandler from '../utils/asyncHandler.js'
import logger from '../utils/logger.js'

// ── Helper: Build search query ────────────────────────
const buildSearchQuery = (search, fields) => {
    if (!search) return {}
    return {
        $or: fields.map(field => ({
            [field]: { $regex: search, $options: 'i' }
        }))
    }
}

// ── Get All Users (Paginated + Search) ────────────────
export const getUsers = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, search = '' } = req.query

    const query = buildSearchQuery(search, ['fullName', 'email', 'phone'])
    
    const users = await User.find(query)
        .select('-password -refreshToken')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit))

    const total = await User.countDocuments(query)

    return res.status(200).json(
        new ApiResponse(200, {
            users,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / limit)
            }
        }, 'Users retrieved successfully')
    )
})

// ── Get All Vendors (Paginated + Search) ──────────────
export const getVendors = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, search = '' } = req.query

    const query = buildSearchQuery(search, ['shopName', 'address', 'city'])
    
    const vendors = await VendorProfile.find(query)
        .populate('userId', 'fullName email phone')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit))

    const total = await VendorProfile.countDocuments(query)

    return res.status(200).json(
        new ApiResponse(200, {
            vendors,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / limit)
            }
        }, 'Vendors retrieved successfully')
    )
})

// ── Get All Orders (Paginated + Search) ───────────────
export const getOrders = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, search = '', status = '' } = req.query

    let query = {}
    
    if (search) {
        query = {
            $or: [
                { fileName: { $regex: search, $options: 'i' } },
                { pickupToken: { $regex: search, $options: 'i' } }
            ]
        }
    }
    
    if (status) {
        query.status = status
    }

    const orders = await Order.find(query)
        .populate('customerId', 'fullName email phone')
        .populate('vendorId', 'shopName')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit))

    const total = await Order.countDocuments(query)

    return res.status(200).json(
        new ApiResponse(200, {
            orders,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / limit)
            }
        }, 'Orders retrieved successfully')
    )
})

// ── Get Dashboard Stats ───────────────────────────────
export const getDashboardStats = asyncHandler(async (req, res) => {
    // Count totals
    const totalUsers = await User.countDocuments()
    const totalVendors = await VendorProfile.countDocuments()
    const totalOrders = await Order.countDocuments()
    const totalDisputes = await Dispute.countDocuments()

    // Plan distribution
    const planDistribution = await VendorPlan.aggregate([
        { $group: { _id: '$plan', count: { $sum: 1 } } }
    ])

    // Daily orders (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const dailyOrders = await Order.aggregate([
        {
            $match: {
                createdAt: { $gte: thirtyDaysAgo }
            }
        },
        {
            $group: {
                _id: {
                    $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
                },
                count: { $sum: 1 },
                revenue: { $sum: '$totalAmount' }
            }
        },
        { $sort: { _id: 1 } }
    ])

    // Order status distribution
    const orderStatusDistribution = await Order.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
    ])

    // Recent disputes
    const recentDisputes = await Dispute.find()
        .populate('orderId', 'pickupToken totalAmount')
        .populate('customerId', 'fullName')
        .sort({ createdAt: -1 })
        .limit(5)

    return res.status(200).json(
        new ApiResponse(200, {
            totals: {
                users: totalUsers,
                vendors: totalVendors,
                orders: totalOrders,
                disputes: totalDisputes
            },
            planDistribution: planDistribution.reduce((acc, item) => {
                acc[item._id] = item.count
                return acc
            }, {}),
            dailyOrders,
            orderStatusDistribution: orderStatusDistribution.reduce((acc, item) => {
                acc[item._id] = item.count
                return acc
            }, {}),
            recentDisputes
        }, 'Dashboard stats retrieved successfully')
    )
})

// ── Resolve Dispute ───────────────────────────────────
export const resolveDispute = asyncHandler(async (req, res) => {
    const { disputeId } = req.params
    const { resolution, resolutionNote } = req.body

    if (!['customer_favor', 'vendor_favor'].includes(resolution)) {
        throw new ApiError(400, 'Invalid resolution. Use customer_favor or vendor_favor')
    }

    const dispute = await Dispute.findById(disputeId)
        .populate('orderId')
        .populate('customerId')

    if (!dispute) {
        throw new ApiError(404, 'Dispute not found')
    }

    if (dispute.status !== 'open') {
        throw new ApiError(400, 'Dispute is already resolved')
    }

    // Update dispute
    dispute.status = resolution === 'customer_favor' ? 'resolved_customer_favor' : 'resolved_vendor_favor'
    dispute.resolutionNote = resolutionNote
    dispute.resolvedAt = new Date()
    dispute.resolvedBy = req.user._id

    await dispute.save()

    // If customer favor, refund to wallet
    if (resolution === 'customer_favor') {
        const order = dispute.orderId
        const customerId = dispute.customerId._id

        let wallet = await Wallet.findOne({ userId: customerId })
        if (!wallet) {
            wallet = await Wallet.create({ userId: customerId })
        }

        await wallet.addRefundCredit(
            order.totalAmount,
            order._id,
            `Refund for dispute #${dispute._id.toString().slice(-6)} - Resolved in your favor`
        )

        // Update user's wallet balance
        await User.findByIdAndUpdate(
            customerId,
            { $inc: { walletBalance: order.totalAmount } }
        )

        logger.info(`Dispute ${disputeId} resolved in customer favor. Refunded ₹${order.totalAmount}`)
    } else {
        logger.info(`Dispute ${disputeId} resolved in vendor favor`)
    }

    return res.status(200).json(
        new ApiResponse(200, dispute, 'Dispute resolved successfully')
    )
})

// ── Get All Disputes ──────────────────────────────────
export const getDisputes = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, status = '' } = req.query

    let query = {}
    if (status) {
        query.status = status
    }

    const disputes = await Dispute.find(query)
        .populate('orderId', 'pickupToken totalAmount fileName')
        .populate('customerId', 'fullName email')
        .populate('resolvedBy', 'fullName')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit))

    const total = await Dispute.countDocuments(query)

    return res.status(200).json(
        new ApiResponse(200, {
            disputes,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / limit)
            }
        }, 'Disputes retrieved successfully')
    )
})

// ── Coupon Management ─────────────────────────────────
// In-memory coupon storage (replace with DB model in production)
let coupons = []

export const createCoupon = asyncHandler(async (req, res) => {
    const { code, discountValue, minOrder = 0, expiresAt, maxUses = null } = req.body

    if (!code || !discountValue || !expiresAt) {
        throw new ApiError(400, 'code, discountValue, and expiresAt are required')
    }

    // Check if code already exists
    const existing = coupons.find(c => c.code === code.toUpperCase())
    if (existing) {
        throw new ApiError(400, 'Coupon code already exists')
    }

    const coupon = {
        _id: Date.now().toString(),
        code: code.toUpperCase(),
        discountValue: parseFloat(discountValue),
        minOrder: parseFloat(minOrder),
        expiresAt: new Date(expiresAt),
        maxUses: maxUses ? parseInt(maxUses) : null,
        usedCount: 0,
        isActive: true,
        createdAt: new Date()
    }

    coupons.push(coupon)

    logger.info(`Coupon created: ${coupon.code}`)

    return res.status(201).json(
        new ApiResponse(201, coupon, 'Coupon created successfully')
    )
})

export const getCoupons = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20 } = req.query

    const sortedCoupons = coupons
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice((page - 1) * limit, page * limit)

    return res.status(200).json(
        new ApiResponse(200, {
            coupons: sortedCoupons,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: coupons.length,
                totalPages: Math.ceil(coupons.length / limit)
            }
        }, 'Coupons retrieved successfully')
    )
})

export const deleteCoupon = asyncHandler(async (req, res) => {
    const { couponId } = req.params

    const index = coupons.findIndex(c => c._id === couponId)
    if (index === -1) {
        throw new ApiError(404, 'Coupon not found')
    }

    coupons.splice(index, 1)

    return res.status(200).json(
        new ApiResponse(200, null, 'Coupon deleted successfully')
    )
})

// ── Broadcast Notifications ───────────────────────────
export const broadcastNotification = asyncHandler(async (req, res) => {
    const { target, title, body, data = {} } = req.body

    if (!['vendors', 'customers', 'all'].includes(target)) {
        throw new ApiError(400, 'Invalid target. Use vendors, customers, or all')
    }

    if (!title || !body) {
        throw new ApiError(400, 'Title and body are required')
    }

    let users = []

    if (target === 'vendors') {
        users = await User.find({ role: 'vendor', fcmToken: { $exists: true, $ne: null } })
    } else if (target === 'customers') {
        users = await User.find({ role: 'customer', fcmToken: { $exists: true, $ne: null } })
    } else {
        users = await User.find({ fcmToken: { $exists: true, $ne: null } })
    }

    const tokens = users.map(u => u.fcmToken)

    // In production, use FCM to send notifications
    // For now, log the broadcast
    logger.info(`Broadcast notification to ${target}: ${title} (${tokens.length} recipients)`)

    return res.status(200).json(
        new ApiResponse(200, {
            target,
            recipientCount: tokens.length,
            title,
            body
        }, `Notification broadcast to ${tokens.length} ${target}`)
    )
})

export default {
    getUsers,
    getVendors,
    getOrders,
    getDashboardStats,
    resolveDispute,
    getDisputes,
    createCoupon,
    getCoupons,
    deleteCoupon,
    broadcastNotification
}
