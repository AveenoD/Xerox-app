import mongoose from 'mongoose'
import VendorProfile from '../models/vendorProfile.models.js'
import asyncHandler from '../utils/asyncHandler.js'
import { ApiError } from '../utils/ApiError.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import uploadOnCloudinary from '../utils/cloudinary.js'
import { Order } from '../models/order.models.js'
import { User } from '../models/user.models.js'
import { Wallet } from '../models/wallet.models.js'
import { creditReferralBonus } from './referral.controller.js'
import { startSLAMonitoring, stopSLAMonitoring } from '../utils/slaMonitor.js'
import logger from '../utils/logger.js'

const BOOKING_FEE = 2 // ₹2 on cash orders — Phase 1

// ── Create Order ──────────────────────────────────────
const createOrder = asyncHandler(async (req, res) => {
    const { vendorId, paymentMethod, useWallet } = req.body

    const printConfig = typeof req.body.printConfig === 'string'
        ? JSON.parse(req.body.printConfig)
        : req.body.printConfig

    const { paperSize, printType, copies } = printConfig
    const pageCount = Number(req.body.pageCount)

    // Vendor + pricing check
    const vendor = await VendorProfile.findById(vendorId)
    if (!vendor) throw new ApiError(404, "Vendor not found")
    if (!vendor.isOpen) throw new ApiError(400, "This shop is currently closed")

    const priceEntry = vendor.pricing.find(
        p => p.paperSize === paperSize && p.printType === printType
    )
    if (!priceEntry) throw new ApiError(400, "Vendor does not offer this print type")
    if (!paymentMethod) throw new ApiError(400, "Please select payment method")

    // File upload
    const filePath = req.file?.path
    if (!filePath) throw new ApiError(400, "Please select a file")

    const fileUpload = await uploadOnCloudinary(filePath)
    if (!fileUpload?.url) throw new ApiError(500, "File upload failed")

    // ── Pricing Calculation ───────────────────────
    const user = await User.findById(req.user._id)
    let freePagesUsed = 0
    let effectivePageCount = pageCount

    // Use free pages if available
    if (user.freePages > 0) {
        freePagesUsed = Math.min(user.freePages, pageCount)
        effectivePageCount = pageCount - freePagesUsed
    }

    const printCost = priceEntry.pricePerPage * effectivePageCount * copies
    const bookingFee = paymentMethod === 'cash' ? BOOKING_FEE : 0

    let walletAmountUsed = 0
    let finalAmount = printCost + bookingFee

    // Use wallet balance if requested
    if (useWallet && finalAmount > 0) {
        const wallet = await Wallet.findOne({ userId: req.user._id })
        if (wallet) {
            const totalWallet = wallet.promotionalBalance + wallet.refundedBalance
            walletAmountUsed = Math.min(totalWallet, finalAmount)
            finalAmount = finalAmount - walletAmountUsed
        }
    }

    // Minimum order ₹20 to use wallet
    if (walletAmountUsed > 0 && (printCost + bookingFee) < 20) {
        walletAmountUsed = 0
        finalAmount = printCost + bookingFee
    }

    const pickupToken = Math.floor(1000 + Math.random() * 9000).toString()

    // ── Mongoose Transaction (Atomic) ─────────────
    const session = await mongoose.startSession()
    session.startTransaction()

    try {
        // 1. Deduct wallet if used
        // FIX: pass session so debit is atomic with order creation
        if (walletAmountUsed > 0) {
            const wallet = await Wallet.findOne({ userId: req.user._id }).session(session)
            if (!wallet) throw new Error('Wallet not found')
            await wallet.debit(walletAmountUsed, null, `Order payment — ₹${walletAmountUsed} from wallet`, session)
        }

        // 2. Deduct free pages
        if (freePagesUsed > 0) {
            await User.findByIdAndUpdate(
                req.user._id,
                { $inc: { freePages: -freePagesUsed } },
                { session }
            )
        }

        // 3. Create order
        const [order] = await Order.create([{
            customerId: req.user._id,
            vendorId,
            fileUrl: fileUpload.url,
            filePublicId: fileUpload.public_id,
            fileName: req.file.originalname,
            fileType: req.file.mimetype.split('/')[1],
            pageCount,
            printConfig: { paperSize, printType, copies },
            pricePerPage: priceEntry.pricePerPage,
            totalAmount: printCost,
            bookingFee,
            walletAmountUsed,
            freePagesUsed,
            finalAmount,
            pickupToken,
            payment: {
                method: paymentMethod,
                status: 'unpaid'
            }
        }], { session })

        await session.commitTransaction()
        session.endSession()

        // 4. Check if this is referee's FIRST order → credit referrer bonus
        // Only count completed orders (not cancelled/rejected)
        const completedOrdersCount = await Order.countDocuments({ 
            customerId: req.user._id,
            status: { $nin: ['rejected', 'cancelled'] }
        })
        
        // Trigger referral bonus on first successful order if total >= ₹20
        if (completedOrdersCount === 1 && finalAmount >= 20) {
            await creditReferralBonus(req.user._id, order._id, finalAmount)
        }

        // Start SLA monitoring for this order
        startSLAMonitoring(order._id.toString(), vendorId)

        logger.info(`Order created: ${order._id} — ₹${finalAmount} — ${paymentMethod}`)

        return res.status(201).json(
            new ApiResponse(201, {
                order,
                breakdown: {
                    printCost,
                    freePagesUsed,
                    bookingFee,
                    walletAmountUsed,
                    finalAmount
                }
            }, "Order placed successfully")
        )

    } catch (err) {
        await session.abortTransaction()
        session.endSession()
        logger.error('Order creation failed:', err.message)
        throw new ApiError(500, "Order placement failed. Please try again.")
    }
})

// ── Get My Orders (Customer) ──────────────────────────
const getMyOrders = asyncHandler(async (req, res) => {
    const orders = await Order.find({ customerId: req.user._id })
        .sort({ createdAt: -1 })

    return res.status(200).json(
        new ApiResponse(200, orders, "Orders fetched successfully")
    )
})

// ── Get Vendor Orders ─────────────────────────────────
const getVendorOrders = asyncHandler(async (req, res) => {
    const vendor = await VendorProfile.findOne({ userId: req.user._id })
    if (!vendor) throw new ApiError(404, "Vendor not found")

    const orders = await Order.find({ vendorId: vendor._id })
        .sort({ createdAt: -1 })

    return res.status(200).json(
        new ApiResponse(200, orders, "Orders fetched successfully")
    )
})

// ── Get Order By ID ───────────────────────────────────
const getOrderById = asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.orderId)
    if (!order) throw new ApiError(404, "Order not found")

    // Only customer or vendor of this order
    const vendor = req.user.role === 'vendor'
        ? await VendorProfile.findOne({ userId: req.user._id })
        : null

    const isCustomer = order.customerId.toString() === req.user._id.toString()
    const isVendor = vendor && order.vendorId.toString() === vendor._id.toString()

    if (!isCustomer && !isVendor) {
        throw new ApiError(403, "Unauthorized")
    }

    return res.status(200).json(
        new ApiResponse(200, order, "Order fetched")
    )
})

// ── Update Order Status ───────────────────────────────
const updateOrderStatus = asyncHandler(async (req, res) => {
    const { status, cancelReason } = req.body
    const { orderId } = req.params

    const order = await Order.findById(orderId)
    if (!order) throw new ApiError(404, "Order not found")

    // ── Customer Cancel (pending only) ────────────
    if (req.user.role === 'customer') {
        if (order.customerId.toString() !== req.user._id.toString()) {
            throw new ApiError(403, "Unauthorized")
        }
        if (order.status !== 'pending') {
            throw new ApiError(400, "Order can only be cancelled while pending")
        }
        if (status !== 'cancelled') {
            throw new ApiError(400, "Customers can only cancel orders")
        }

        // Stop SLA monitoring
        stopSLAMonitoring(order._id.toString())

        // Refund wallet amount if used
        if (order.walletAmountUsed > 0) {
            let wallet = await Wallet.findOne({ userId: req.user._id })
            if (!wallet) wallet = await Wallet.create({ userId: req.user._id })
            await wallet.addRefundCredit(
                order.walletAmountUsed,
                order._id,
                `Refund for cancelled order #${order.pickupToken}`
            )
        }

        // Restore free pages if used
        if (order.freePagesUsed > 0) {
            await User.findByIdAndUpdate(
                req.user._id,
                { $inc: { freePages: order.freePagesUsed } }
            )
        }

        order.status = 'cancelled'
        order.cancelReason = cancelReason || 'customer_cancelled'
        await order.save()

        logger.info(`Order ${order._id} cancelled by customer`)

        return res.status(200).json(
            new ApiResponse(200, order, "Order cancelled successfully")
        )
    }

    // ── Vendor Status Update ──────────────────────
    const validStatus = ['accepted', 'printing', 'completed', 'rejected']
    if (!validStatus.includes(status)) {
        throw new ApiError(400, "Invalid status")
    }

    const vendor = await VendorProfile.findOne({ userId: req.user._id })
    if (!vendor) throw new ApiError(404, "Vendor not found")
    if (order.vendorId.toString() !== vendor._id.toString()) {
        throw new ApiError(403, "Unauthorized")
    }

    // Check plan limit when accepting order
    if (status === 'accepted' && req.vendorPlan) {
        if (req.vendorPlan.isLimitReached()) {
            throw new ApiError(403, 
                `Upgrade to accept more orders. ` +
                `You have used ${req.vendorPlan.ordersUsedThisMonth} orders this month. ` +
                `Current plan: ${req.vendorPlan.plan.toUpperCase()}`
            )
        }
    }

    // Vendor reject — refund wallet
    if (status === 'rejected' && order.walletAmountUsed > 0) {
        let wallet = await Wallet.findOne({ userId: order.customerId })
        if (!wallet) wallet = await Wallet.create({ userId: order.customerId })
        await wallet.addRefundCredit(
            order.walletAmountUsed,
            order._id,
            `Refund — order #${order.pickupToken} rejected by shop`
        )

        // Restore free pages
        if (order.freePagesUsed > 0) {
            await User.findByIdAndUpdate(
                order.customerId,
                { $inc: { freePages: order.freePagesUsed } }
            )
        }
    }

    order.status = status
    if (status === 'rejected') order.cancelReason = 'vendor_rejected'
    await order.save()

    // Stop SLA monitoring when order is accepted or rejected
    if (status === 'accepted' || status === 'rejected') {
        stopSLAMonitoring(order._id.toString())
    }

    // Increment order count when accepted
    if (status === 'accepted' && req.vendorPlan) {
        await req.vendorPlan.incrementOrderCount()
        logger.info(`Order count incremented for vendor ${vendor._id}`)
    }

    logger.info(`Order ${order._id} → ${status} by vendor ${vendor._id}`)

    return res.status(200).json(
        new ApiResponse(200, order, `Order ${status} successfully`)
    )
})

export {
    createOrder,
    getMyOrders,
    getVendorOrders,
    getOrderById,
    updateOrderStatus
}