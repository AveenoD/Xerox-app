import VendorProfile from '../models/vendorProfile.models.js'
import asyncHandler from '../utils/asyncHandler.js'
import { ApiError } from '../utils/ApiError.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import { User } from '../models/user.models.js'
import { Order } from '../models/order.models.js'


const rateVendor = asyncHandler(async (req, res) => {
const { score, review } = req.body
   const vendor = await VendorProfile.findById(req.params.vendorId) 
    if (!vendor) throw new ApiError(404, "Vendor not found")

    const completedOrder = await Order.findOne({
        customerId: req.user._id,
        vendorId: req.params.vendorId,
        status: "completed"
    })

    if (!completedOrder) {
        throw new ApiError(403, "Sirf woh customer rate kar sakta hai jisne order complete kiya ho")
    }

    const alreadyRated = vendor.ratings.find(
        r => r.customerId.toString() === req.user._id.toString()
    )
    if (alreadyRated) throw new ApiError(400, "Already rated")

    vendor.ratings.push({
        customerId: req.user._id,
        score,
        review
    })

    const totalRatings = vendor.ratings.length
    const sum = vendor.ratings.reduce((acc, r) => acc + r.score, 0)
    vendor.averageRating = sum / totalRatings

    await vendor.save()

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Vendor rated successfully"))
})

export {rateVendor}