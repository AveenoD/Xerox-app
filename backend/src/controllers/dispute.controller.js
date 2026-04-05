import asyncHandler from '../utils/asyncHandler.js'
import { ApiError } from '../utils/ApiError.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import { Dispute } from '../models/dispute.models.js'
import { Order } from '../models/order.models.js'

// ── File a dispute ────────────────────────────────────
export const fileDispute = asyncHandler(async (req, res) => {
    const { orderId, reason, description } = req.body

    const order = await Order.findById(orderId)
    if (!order) throw new ApiError(404, "Order not found")

    // Only customer who placed the order
    if (order.customerId.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Unauthorized")
    }

    // Only completed orders can have disputes
    if (order.status !== 'completed') {
        throw new ApiError(400, "Disputes can only be filed for completed orders")
    }

    // One dispute per order
    const existing = await Dispute.findOne({ orderId })
    if (existing) throw new ApiError(400, "Dispute already filed for this order")

    const dispute = await Dispute.create({
        orderId,
        customerId: req.user._id,
        vendorId: order.vendorId,
        reason,
        description
    })

    return res.status(201).json(
        new ApiResponse(201, dispute, "Dispute filed successfully")
    )
})

// ── Get my disputes ───────────────────────────────────
export const getMyDisputes = asyncHandler(async (req, res) => {
    const disputes = await Dispute.find({ customerId: req.user._id })
        .populate('orderId', 'pickupToken fileName totalAmount createdAt')
        .sort({ createdAt: -1 })

    return res.status(200).json(
        new ApiResponse(200, disputes, "Disputes fetched")
    )
})