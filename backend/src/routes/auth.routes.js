import {Router} from 'express'
import { verifyJWT } from '../middlewares/auth.middleware.js';
import { upload } from '../middlewares/multer.middleware.js'
import {
     registerUser,
    verifyEmailOtp,
    resendEmailOtp,
    loginUser,
    logoutUser,
    refreshAccessToken,
    sendphoneOtp,
    verifyPhoneOtp
} from '../controllers/auth.controllers.js'

const router =  Router();

router.route('/register').post(upload.single("avatar"), registerUser)
router.route('/verify-email-otp').post(verifyEmailOtp)
router.route('/resend-email-otp').post(resendEmailOtp)
router.route('/login').post(loginUser)
router.route('/logout').post(verifyJWT, logoutUser)
router.route('/refresh-token').post(refreshAccessToken)
router.route('/send-phone-otp').post(verifyJWT, sendphoneOtp)
router.route('/verify-phone-otp').post(verifyJWT, verifyPhoneOtp)

export default router;