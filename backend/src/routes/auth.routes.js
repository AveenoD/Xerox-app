import { Router } from 'express'
import rateLimit from 'express-rate-limit';
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

const router = Router();

// Rate limiters
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per window
    message: {
        statusCode: 429,
        message: 'Too many attempts, please try again after 15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

const otpLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 3, // 3 attempts per minute
    message: {
        statusCode: 429,
        message: 'Too many OTP requests, please try again after a minute'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Routes with rate limiting (applied to auth endpoints only, NOT refresh-token)
router.route('/register').post(authLimiter, upload.single("avatar"), registerUser);
router.route('/verify-email-otp').post(otpLimiter, verifyEmailOtp);
router.route('/resend-email-otp').post(otpLimiter, resendEmailOtp);
router.route('/login').post(authLimiter, loginUser);
router.route('/logout').post(verifyJWT, logoutUser);
router.route('/refresh-token').post(refreshAccessToken); // No rate limit - needed for silent refresh
router.route('/send-phone-otp').post(verifyJWT, otpLimiter, sendphoneOtp);
router.route('/verify-phone-otp').post(verifyJWT, otpLimiter, verifyPhoneOtp);

export default router;