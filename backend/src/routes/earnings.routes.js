import { Router } from 'express'
import {
    getEarningsDashboard,
    getEarningsByDateRange,
    requestPayout
} from '../controllers/earnings.controller.js'
import { verifyJWT } from '../middlewares/auth.middleware.js'

const router = Router()

// All routes require authentication
router.use(verifyJWT)

// Get earnings dashboard
router.route('/dashboard').get(getEarningsDashboard)

// Get earnings by date range
router.route('/by-date').get(getEarningsByDateRange)

// Request payout
router.route('/payout').post(requestPayout)

export default router
