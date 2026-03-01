import { User } from '../models/user.models.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import uploadOnCloudinary from '../utils/cloudinary.js';
import asyncHandler from '../utils/asyncHandler.js';

const getUserProfile = asyncHandler(async(req, res)=>{
    
    const user = await User.findById(req.user?._id).select("-password -refreshToken -emailOtp -phoneOtp -emailOtpExpiry -phoneOtpExpiry -otpAttempts -otpLockUntil");

    if(!user)
    {
        throw new ApiError(404, "User does not exists");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "User profile fetched successfully")
    )
   

})

const updateUserProfile = asyncHandler(async(req, res) =>{
    const {fullName, phone} = req.body;
    if(!fullName && !phone)
    {
        throw new ApiError(400,"Full name or phone is required");
    }
    const user = await User.findByIdAndUpdate(req.user?._id,{
        $set:{
            ...(fullName && {fullName}),
            ...(phone && { phone, isPhoneVerified: false})
        }
    },
    {new: true}
)
.select("-password -refreshToken -emailOtp -phoneOtp -emailOtpExpiry -phoneOtpExpiry -otpAttempts -otpLockUntil");
return res
.status(200)
.json(
    new ApiResponse(200, user, "Acount details updated succesfully")
    
);


})
const updateUserAvatar = asyncHandler(async(req, res) => {
    const avatarLocalPath =  req.file?.path
    if(!avatarLocalPath)
    {
        throw new ApiError(400, "Avatar file is missing");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if(!avatar.url)
    {
        throw new ApiError(400,"Error while uploading avatar")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar: avatar.url
            }
        },
        {new: true}
    ).select("-password -refreshToken -emailOtp -phoneOtp -emailOtpExpiry -phoneOtpExpiry -otpAttempts -otpLockUntil")
    return res
    .status(200)
    .json(new ApiResponse(200, user, "Avatar Image updated successfylly"))
})
const changeCurrentPassword = asyncHandler(async(req, res) => {
    const {oldPassword, newPassword} = req.body
    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect)
    {
        throw new ApiError(400, "Invalid password")
    }
    user.password = newPassword
    await user.save({validateBeforeSave: false})
    return res
    .status(200)
    .json(new ApiResponse(200,{}, "Password changed successfully"))
})

export { 
    getUserProfile, 
    updateUserProfile,
    updateUserAvatar,
    changeCurrentPassword
}