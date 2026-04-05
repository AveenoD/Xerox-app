import { Router } from 'express'
import {
    getMyPlan,
    upgradePlan,
    getAllPlans,
    adminUpdatePlan,
    getPlanLimits
} from '../controllers/vendorPlan.controller.js'
import { verifyJWT } from '../middlewares/auth.middleware.js'

const router = Router()

// Public route to see plan limits
router.route('/limits').get(getPlanLimits)

// Vendor routes (protected)
router.route('/my-plan').get(verifyJWT, getMyPlan)
router.route('/upgrade').post(verifyJWT, upgradePlan)

// Admin routes
router.route('/all').get(verifyJWT, getAllPlans)
router.route('/:vendorId').patch(verifyJWT, adminUpdatePlan)

export default router
