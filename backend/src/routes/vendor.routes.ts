import { Router } from 'express';
import {
  registerVendor,
  getMyVendorProfile,
  getVendorById,
  updateVendor,
  toggleShopStatus,
  searchNearbyVendors,
  getVendorAnalytics,
  calculatePrintCost,
} from '../controllers/vendor.controller.js';
import { verifyJWT, requireVendor, requireUser, optionalAuth } from '../middlewares/auth.middleware.js';

const router = Router();

// Public - search vendors
router.get('/search', optionalAuth, searchNearbyVendors);

// Customer - get vendor details
router.get('/:vendorId', getVendorById);
router.get('/:vendorId/cost', calculatePrintCost);

// Vendor routes (require vendor role)
router.post('/register', verifyJWT, requireUser, registerVendor);
router.get('/profile/me', verifyJWT, requireVendor, getMyVendorProfile);
router.patch('/profile/me', verifyJWT, requireVendor, updateVendor);
router.patch('/profile/status', verifyJWT, requireVendor, toggleShopStatus);
router.get('/analytics/me', verifyJWT, requireVendor, getVendorAnalytics);

export default router;
