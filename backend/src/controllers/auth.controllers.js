import { User } from '../models/user.models.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import uploadOnCloudinary from '../utils/cloudinary.js';
import { Options } from '../utils/options.js';
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import disposableEmailDomains from 'disposable-email-domains'
import { generateOtp } from '../utils/otpGenerator.js'
import { sendOtpEmail } from '../utils/mailer.js'


const registerUser = asyncHandler(async(req, res) => {
    const {fullName, email, phone, password} = req.body;
    
    if([fullName, email, phone, password].some((fields) => fields?.trim() === ""))
    {
        throw new ApiError(400, "All fileds are required!")
    }

    const existedUser = await User.findOne({
        $or:[{email},{phone}]
    })

    if(existedUser)
    {
        throw new ApiError(400, "User with this email or number already exists");
    }

    const avatarLocalPath = req.file?.avatar?.[0]?.path || null;

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    if(!avatar)
    {
        throw new ApiError(400, "Failed to upload avatar on cloudinary");
    }

    const user = await User.create({
        fullName,
        avatar,
        email,
        phone,
        password
    });

    const createdUser = await User.findById(user?._id).select("-password -refreshToken");
    if(!createdUser)
    {
        throw new ApiError(500, "Something went wrong while registering user");
    }

    return res
    .status(200)
    .json(new ApiResponse(200, createdUser, "User registered successsfully"));

   
})

export{
    refreshAccessToken,
    registerUser
}