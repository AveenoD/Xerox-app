import { Router } from 'express'
import {
    createOrder,
    getMyOrders,
    getVendorOrders,
    getOrderById,
    updateOrderStatus
} from '../controllers/createOrder.controllers.js'

import { verifyJWT } from '../middlewares/auth.middleware.js'
import { upload } from '../middlewares/multer.middleware.js'
import { attachVendorPlan } from '../middlewares/planCheck.middleware.js'
const router = Router()

router.route('/create').post(verifyJWT, upload.single("document"), createOrder)
router.route('/my-orders').get(verifyJWT, getMyOrders)
router.route('/vendor-orders').get(verifyJWT, getVendorOrders)
router.route('/:orderId').get(verifyJWT, getOrderById)
router.route('/:orderId/status').patch(verifyJWT, attachVendorPlan, updateOrderStatus)

export default router