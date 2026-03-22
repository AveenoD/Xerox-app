import { Router } from 'express'
import { verifyJWT } from '../middlewares/auth.middleware.js'
import { fileDispute, getMyDisputes } from '../controllers/dispute.controller.js'

const router = Router()

router.post('/', verifyJWT, fileDispute)
router.get('/me', verifyJWT, getMyDisputes)

export default router