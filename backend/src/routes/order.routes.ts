import { Router } from 'express';
import {
  createOrder,
  acceptOrder,
  rejectOrder,
  markPrinting,
  markReady,
  completeOrder,
  cancelOrder,
  getOrderById,
  getMyOrders,
  getVendorOrders,
  toggleKeepForFuture,
} from '../controllers/order.controller.js';
import { verifyJWT, requireUser, requireVendor } from '../middlewares/auth.middleware.js';
import { upload } from '../middlewares/multer.middleware.js';
import { orderLimiter } from '../middlewares/rateLimiter.middleware.js';

const router = Router();

// Customer routes
router.post('/', verifyJWT, requireUser, orderLimiter, upload.single('file'), createOrder);
router.get('/my-orders', verifyJWT, requireUser, getMyOrders);
router.get('/:orderId', verifyJWT, getOrderById);
router.patch('/:orderId/cancel', verifyJWT, requireUser, cancelOrder);
router.patch('/:orderId/keep', verifyJWT, requireUser, toggleKeepForFuture);
router.patch('/:orderId/complete', verifyJWT, requireUser, completeOrder);

// Vendor routes
router.get('/vendor/orders', verifyJWT, requireVendor, getVendorOrders);
router.patch('/:orderId/accept', verifyJWT, requireVendor, acceptOrder);
router.patch('/:orderId/reject', verifyJWT, requireVendor, rejectOrder);
router.patch('/:orderId/printing', verifyJWT, requireVendor, markPrinting);
router.patch('/:orderId/ready', verifyJWT, requireVendor, markReady);

export default router;
