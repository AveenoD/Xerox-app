import { Router } from 'express'
import {
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
} from '../controllers/admin.controller.js'
import { verifyJWT } from '../middlewares/auth.middleware.js'

const router = Router()

// Middleware to check admin role
const requireAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({
            statusCode: 403,
            message: 'Admin access required'
        })
    }
    next()
}

// Dashboard stats
router.route('/dashboard-stats').get(verifyJWT, requireAdmin, getDashboardStats)

// Users management
router.route('/users').get(verifyJWT, requireAdmin, getUsers)

// Vendors management
router.route('/vendors').get(verifyJWT, requireAdmin, getVendors)

// Orders management
router.route('/orders').get(verifyJWT, requireAdmin, getOrders)

// Disputes management
router.route('/disputes').get(verifyJWT, requireAdmin, getDisputes)
router.route('/disputes/:disputeId/resolve').patch(verifyJWT, requireAdmin, resolveDispute)

// Coupon management
router.route('/coupons')
    .get(verifyJWT, requireAdmin, getCoupons)
    .post(verifyJWT, requireAdmin, createCoupon)

router.route('/coupons/:couponId')
    .delete(verifyJWT, requireAdmin, deleteCoupon)

// Broadcast notifications
router.route('/broadcast').post(verifyJWT, requireAdmin, broadcastNotification)

export default router
