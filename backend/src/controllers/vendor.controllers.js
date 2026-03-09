import VendorProfile from '../models/vendorProfile.models.js'
import asyncHandler from '../utils/asyncHandler.js'
import  {ApiError}  from '../utils/ApiError.js'
import  {ApiResponse}  from '../utils/ApiResponse.js'
import { User } from '../models/user.models.js'
import uploadOnCloudinary from '../utils/cloudinary.js'
import { generateAccessTokenAndRefreshToken } from './auth.controllers.js'
import { Options } from '../utils/Options.js'
// TODO
// 1. registerVendor   → customer ka role vendor banta hai ✅
// 2. getNearbyVendors → GPS $nearSphere query ✅
// 3. getVendorById    → single vendor detail
// 4. updateVendor     → shop info update
// 5. updatePricing    → pricing update
// 6. toggleStatus     → shop open/close

const registerVendor = asyncHandler(async (req, res) => {
    const { shopName, address, pincode, city, latitude, longitude } = req.body

    const existingVendor = await VendorProfile.findOne({ userId: req.user._id })

    if (existingVendor) {
        throw new ApiError(400, "Already registered as a Vendor");
    }

    if ([shopName, address, pincode, city, latitude, longitude].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "All the fields are required");
    }

    const shopPhotoLocalPath = req.file?.path || null;
    const shopPhotoUpload = shopPhotoLocalPath ? await uploadOnCloudinary(shopPhotoLocalPath) : null;

    const shopPhotoUrl = shopPhotoUpload?.url || null;

    const vendor = await VendorProfile.create({
        userId: req.user._id,
        shopName,
        address,
        pincode,
        city,
        shopPhoto: shopPhotoUrl,
        location: {
            type: "Point",
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
        }
    })

    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                role:"vendor",
                vendorProfileId: vendor._id
            }
        }
    )

    const { accessToken, refreshToken } = 
    await generateAccessTokenAndRefreshToken(req.user._id)

    return res
    .status(201)
    .cookie("refreshToken", refreshToken, Options)
    .json(new ApiResponse(201, { vendor, accessToken }, 
        "Vendor registered successfully"))
})

const getNearbyVendors = asyncHandler(async (req, res) => {
    const { latitude, longitude, maxDistance = 5000 } = req.query

    if(!latitude || !longitude){
        throw new ApiError(400, "Latitude and longitude are required")
    }

    const vendors = await VendorProfile.find({
        location: {
            $nearSphere: {
                $geometry: {
                    type: "Point",
                    coordinates: [parseFloat(longitude), parseFloat(latitude)]
                },
                $maxDistance: parseInt(maxDistance)
            }
        },
        isOpen: true
    })

    return res
        .status(200)
        .json(new ApiResponse(200, vendors, "Nearby vendors fetched"))
})

const getVendorById = asyncHandler(async(req, res) => {

    const vendor = await VendorProfile.findById(req.params.vendorId)

    if(!vendor)
    {
        throw new ApiError(404, "Vendor not found");
    }
    return res
    .status(200)
    .json(new ApiResponse(200, vendor, "Vendor fetched successfully"))
})

const getMyVendorProfile = asyncHandler(async(req, res) => {
    const vendor = await VendorProfile.findOne({ userId: req.user._id })
    if(!vendor) throw new ApiError(404, "Vendor profile not found")
    return res.status(200).json(new ApiResponse(200, vendor, "Vendor profile fetched"))
})

const updateVendor = asyncHandler(async(req, res) => {

    const { shopName, address, pincode, city, latitude, longitude } = req.body

    const updateFields = {}

    if(shopName) updateFields.shopName = shopName
    if(address) updateFields.address = address
    if(pincode) updateFields.pincode = pincode
    if(city) updateFields.city = city

    // Location update
    if(latitude && longitude){
        updateFields.location = {
            type: "Point",
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
        }
    }

    // Shop photo update
    const shopPhotoLocalPath = req.file?.path || null
    if(shopPhotoLocalPath){
        const shopPhotoUpload = await uploadOnCloudinary(shopPhotoLocalPath)
        if(shopPhotoUpload?.url){
            updateFields.shopPhoto = shopPhotoUpload.url
        }
    }

    const vendor = await VendorProfile.findOneAndUpdate(
        { userId: req.user._id },
        { $set: updateFields },
        { new: true }
    )
    if(!vendor) throw new ApiError(404, "Vendor profile not found")

    return res
        .status(200)
        .json(new ApiResponse(200, vendor, "Vendor profile updated"))

})

const updatePricing = asyncHandler(async(req, res) =>{
    const { pricing } = req.body

    const vendor = await VendorProfile.findOneAndUpdate(
    { userId: req.user._id },
    { $set: { pricing } },
    { new: true }
)
    if(!vendor) throw new ApiError(404, "Vendor profile not found")

    return res
    .status(200)
    .json(new ApiResponse(200, vendor, "Pricing updated successfully"))
})

const toggleStatus = asyncHandler(async (req, res) => {
    const vendor = await VendorProfile.findOne({ userId: req.user._id })
    if(!vendor) throw new ApiError(404, "Vendor not found")

    vendor.isOpen = !vendor.isOpen
    await vendor.save()

    return res
        .status(200)
        .json(new ApiResponse(200, 
            { isOpen: vendor.isOpen }, 
            `Shop is now ${vendor.isOpen ? "Open" : "Closed"}`
        ))
})

export {
    registerVendor,
    getNearbyVendors,
    getMyVendorProfile,
    getVendorById,
    updateVendor,
    updatePricing,
    toggleStatus
}
