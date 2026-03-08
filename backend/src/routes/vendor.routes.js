import { Router } from 'express'
import { verifyJWT } from '../middlewares/auth.middleware.js'
import { upload } from '../middlewares/multer.middleware.js'

import {
    registerVendor,
    getNearbyVendors,
    getVendorById,
    updateVendor,
    updatePricing,
    toggleStatus
} from '../controllers/vendor.controllers.js'

const router = Router();

router.route('/register-vendor').post(verifyJWT, upload.single("shopPhoto"), registerVendor)
router.route('/nearby-vendor').get( getNearbyVendors)
router.route('/:vendorId').get(getVendorById )
router.route('/profile/update').put(verifyJWT, upload.single("shopPhoto"),updateVendor)
router.route('/update-pricing').put(verifyJWT, updatePricing)
router.route('/toggle-status').patch(verifyJWT, toggleStatus)

export default router

