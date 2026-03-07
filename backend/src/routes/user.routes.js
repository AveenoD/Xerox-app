import { Router } from 'express'
import { getUserProfile } from '../controllers/user.controller.js'
import { verifyJWT } from '../middlewares/auth.middleware.js'

const router = Router()

router.route('/profile').get(verifyJWT, getUserProfile)

export default router