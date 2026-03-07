import { Router } from 'express'
import { 
    getUserProfile,
    updateUserProfile,
    updateUserAvatar,
    changeCurrentPassword } from '../controllers/user.controllers.js'
import { verifyJWT } from '../middlewares/auth.middleware.js'
import { upload } from '../middlewares/multer.middleware.js'
const router = Router()

router.route('/profile').get(verifyJWT, getUserProfile)
router.route('/profile-update').put(verifyJWT, updateUserProfile)
router.route('/profile/avatar-update') .put(verifyJWT, upload.single("avatar"), updateUserAvatar)
router.route('/profile/password-update').put(verifyJWT, changeCurrentPassword)

export default router