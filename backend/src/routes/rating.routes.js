import {rateVendor} from '../controllers/rating.controllers.js'
import { verifyJWT } from '../middlewares/auth.middleware.js'
import { Router } from 'express'

const router = Router();
router.route('/:vendorId/rate').post(verifyJWT, rateVendor)

export default router;
