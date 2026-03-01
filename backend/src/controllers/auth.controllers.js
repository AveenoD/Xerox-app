import { User } from '../models/user.models.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import uploadOnCloudinary from '../utils/cloudinary.js';
import bcrypt from 'bcrypt'
import disposableEmailDomains from 'disposable-email-domains'
import { generateOtp } from '../utils/otpGenerator.js'
import { sendOtpEmail } from '../utils/mailer.js'

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



    const otp = generateOtp()
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
    const { email, otp} = req.body

    const user = await User.findOne({
        email
    })
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

const resendEmailOtp = asyncHandler(async (req, res) =>{
    const {email} = req.body
    
    const user = await User.findOne({email})
    if(!user){
        throw new ApiError(404, "User does not exists!");
    }
if(user.emailOtpExpiry && user.emailOtpExpiry.getTime() - 9 * 60 * 1000 > Date.now()){
    throw new ApiError(429, "Please wait 60 seconds before requesting a new OTP")
}
    const otp = generateOtp();
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

export {
    registerUser,
    verifyEmailOtp,
    resendEmailOtp
}