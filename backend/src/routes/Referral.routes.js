import { Router } from 'express'
import { verifyJWT } from '../middlewares/auth.middleware.js'
import { getMyReferral } from '../controllers/referral.controller.js'

const router = Router()

router.get('/me', verifyJWT, getMyReferral)

export default router