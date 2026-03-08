import { User } from '../models/user.models.js';
import {ApiError} from '../utils/ApiError.js';
import {ApiResponse} from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import uploadOnCloudinary from '../utils/cloudinary.js';
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { sendOtpSms } from '../utils/sms.js'
import disposableEmailDomains from 'disposable-email-domains' with { type: 'json' }
import { generateOTP } from '../utils/otpGenerator.js'
import { sendOtpEmail } from '../utils/mailer.js'
import {Options} from '../utils/Options.js'


export const generateAccessTokenAndRefreshToken = async (userId) => {
    const user = await User.findById(userId)
    const accessToken = user.generateAccessToken()
    const refreshToken = user.generateRefreshToken()
    user.refreshToken = refreshToken
    await user.save({ validateBeforeSave: false })
    return { accessToken, refreshToken }
}

const validateNumber = (number) => {
    const regex = /^[6-9]\d{9}$/;
    return regex.test(number)
}

const registerUser = asyncHandler(async (req, res) => {
    const { fullName, email, phone, password } = req.body;

    if ([fullName, email, phone, password].some((fields) => fields?.trim() === "")) {
        throw new ApiError(400, "All fileds are required!")
    }

    if (!validateNumber(phone)) {
        throw new ApiError(400, "Please enter a valid number")
    }
    const domain = email.split("@")[1];
    if (disposableEmailDomains.includes(domain)) {
        throw new ApiError(400, "Please use valid mail")
    }
    const existedUser = await User.findOne({
        $or: [{ email }, { phone }]
    })

    if (existedUser) {
        throw new ApiError(400, "User with this email or number already exists");
    }




    const avatarLocalPath = req.file?.path || null;
    const avatarUpload = avatarLocalPath ?
        await uploadOnCloudinary(avatarLocalPath) : null
    const avatarUrl = avatarUpload?.url || null

    const user = await User.create({
        fullName,
        avatar: avatarUrl,
        email,
        phone,
        password
    });



    const otp = generateOTP()
    const hashedOtp = await bcrypt.hash(otp, 10)
    user.emailOtp = hashedOtp
    user.emailOtpExpiry = new Date(Date.now() + 10 * 60 * 1000)
    user.otpAttempts = 0
    await user.save({ validateBeforeSave: false })

    await sendOtpEmail(email, otp)

    return res.status(201).json(
        new ApiResponse(201, {}, "OTP sent to your email. Please verify.")
    )


})

const verifyEmailOtp = asyncHandler(async (req, res) => {
    const { email, otp } = req.body

    const user = await User.findOne({
        email
    })
    
console.log("User found:", user?.email)
console.log("emailOtpExpiry:", user?.emailOtpExpiry)
console.log("current time:", new Date())
console.log("isExpired:", user?.emailOtpExpiry < new Date())
    if (!user) {
        throw new ApiError(404, "User not found")
    }
    if (user.otpLockUntil && user.otpLockUntil > new Date()) {
        const minutesLeft = Math.ceil((user.otpLockUntil - new Date()) / 1000 / 60)
        throw new ApiError(429, `Too many attempts. Try after ${minutesLeft} minutes`)
    }
    if (!user.emailOtpExpiry || user.emailOtpExpiry < new Date()) {
        throw new ApiError(400, "OTP has expired. Please request a new one")
    }
    const isOtpCorrect = await bcrypt.compare(otp, user.emailOtp)
    if (!isOtpCorrect) {
        user.otpAttempts += 1
        if (user.otpAttempts >= 3) {
            user.otpLockUntil = new Date(Date.now() + 30 * 60 * 1000)
        }
        await user.save({ validateBeforeSave: false })
        throw new ApiError(400, "Invalid OTP")
    }
    user.isEmailVerified = true
    user.emailOtp = null
    user.emailOtpExpiry = null
    user.otpAttempts = 0
    user.otpLockUntil = null
    await user.save({ validateBeforeSave: false })
    return res.status(200).json(
        new ApiResponse(200, {}, "Email verified successfully")
    )

})

const resendEmailOtp = asyncHandler(async (req, res) => {
    const { email } = req.body

    const user = await User.findOne({ email })
    if (!user) {
        throw new ApiError(404, "User does not exists!");
    }
    if (user.emailOtpExpiry && user.emailOtpExpiry.getTime() - 9 * 60 * 1000 > Date.now()) {
        throw new ApiError(429, "Please wait 60 seconds before requesting a new OTP")
    }
    const otp = generateOTP();
    const hashedOtp = await bcrypt.hash(otp, 10);
    user.emailOtp = hashedOtp;
    user.emailOtpExpiry = new Date(Date.now() + 10 * 60 * 1000)
    user.otpAttempts = 0
    await user.save({ validateBeforeSave: false })
    await sendOtpEmail(email, otp);

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "New OTP sent to your email. Please verify."))
})

const loginUser = asyncHandler(async (req, res) => {
    const { email, phone, password } = req.body
    if (!(email || phone)) {
        throw new ApiError(400, "Email or phone number is required")
    }
    const user = await User.findOne({ $or: [{ email }, { phone }] })

    if (!user) throw new ApiError(404, "User does not exists")

    if (!user.isEmailVerified) throw new ApiError(403, "Please verify your email")

    const isPasswordValid = await user.isPasswordCorrect(password)

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid password")

    }
    const { accessToken, refreshToken } = await generateAccessTokenAndRefreshToken(user._id)
    const loggedUser = await User.findById(user._id).select("-password -refreshToken")

    return res
        .status(200)
        .cookie("refreshToken", refreshToken, Options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedUser, accessToken
                },
                "User loggedin successfully"

            )
        )

})

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1
            }
        },
        {
            new: true
        }
    )
    return res
        .status(200)
        .clearCookie("refreshToken", Options)
        .json(new ApiResponse(200, {}, "User logged out successfully"))
})
const refreshAccessToken = asyncHandler(async (req, res) => {
    const incommingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!incommingRefreshToken) {
        throw new ApiError(401, "Unauthorized request")
    }

    const decodedToken = jwt.verify(
        incommingRefreshToken,
        process.env.REFRESH_TOKEN_SECRET
    )

    const user = await User.findById(decodedToken?._id)

    if (!user) {
        throw new ApiError(401, "Invalid refresh token")
    }

    if (incommingRefreshToken !== user?.refreshToken) {
        throw new ApiError(401, "Refresh token is expired or used");
    }

    const { accessToken, refreshToken: newRefreshToken } = await generateAccessTokenAndRefreshToken(user?._id)

    return res
        .status(200)
        .cookie("refreshToken", newRefreshToken, Options)
        .json(
            new ApiResponse(
                200,
                {
                    accessToken
                },
                "Access Token refreshed"
            )
        )
})

const sendphoneOtp = asyncHandler(async (req, res) => {
    const { phone } = req.body
    const user = await User.findById(req.user._id)
    if (!user) {
        throw new ApiError(404, "User not found")

    }
    const existingPhone = await User.findOne({
        phone,
        _id: { $ne: req.user._id }
    })
    if (existingPhone) {
        throw new ApiError(409, "Phone number already in use")
    }
    const otp = generateOTP()
    const hashedOtp = await bcrypt.hash(otp, 10)
    user.phoneOtp = hashedOtp
    user.phoneOtpExpiry = new Date(Date.now() + 10 * 60 * 1000)
    user.otpAttempts = 0
    await user.save({ validateBeforeSave: false })

    await sendOtpSms(phone, otp)

    return res.status(200).json(
        new ApiResponse(200, {}, "OTP sent to your phone. Please verify.")
    )
})

const verifyPhoneOtp = asyncHandler(async (req, res) => {
    const { phone, otp } = req.body

    const user = await User.findById(req.user._id)

    if (!user) {
        throw new ApiError(404, "User does not exists")
    }
    if (user.otpLockUntil && user.otpLockUntil > new Date()) {
        const minutesLeft = Math.ceil((user.otpLockUntil - new Date()) / 1000 / 60)
        throw new ApiError(429, `Too many attempts. Try after ${minutesLeft} minutes`)
    }
    if (!user.phoneOtpExpiry || user.phoneOtpExpiry < new Date()) {
        throw new ApiError(400, "OTP has expired. Please request a new one")
    }
    const isOtpCorrect = await bcrypt.compare(otp, user.phoneOtp)
    if (!isOtpCorrect) {

        user.otpAttempts += 1
        if (user.otpAttempts >= 3) {
            user.otpLockUntil = new Date(Date.now() + 30 * 60 * 1000)
        }
        await user.save({ validateBeforeSave: false })
        throw new ApiError(400, "Invalid OTP")

    }

    user.isPhoneVerified = true
    user.phoneOtp = null
    user.phoneOtpExpiry = null
    user.otpAttempts = 0
    user.otpLockUntil = null
    await user.save({ validateBeforeSave: false })
    return res.status(200).json(
        new ApiResponse(200, {}, "Phone OTP verified successfully")
    )


})
export {
    registerUser,
    verifyEmailOtp,
    resendEmailOtp,
    loginUser,
    logoutUser,
    refreshAccessToken,
    sendphoneOtp,
    verifyPhoneOtp
}