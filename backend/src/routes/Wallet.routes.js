import { Router } from 'express'
import { verifyJWT } from '../middlewares/auth.middleware.js'
import { getWallet } from '../controllers/wallet.controller.js'

const router = Router()

router.get('/me', verifyJWT, getWallet)

export default router