import VendorProfile from '../models/vendorProfile.models.js'
import asyncHandler from '../utils/asyncHandler.js'
import { ApiError } from '../utils/ApiError.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import uploadOnCloudinary from '../utils/cloudinary.js'
import { Order } from '../models/order.models.js'

const createOrder = asyncHandler(async (req, res) => {
    const { vendorId, printConfig, paymentMethod } = req.body
    const { paperSize, printType, copies } = printConfig
    const pageCount = req.body.pageCount
    const platformFee = 0
     const vendor = await VendorProfile.findById(vendorId)
    if (!vendor) throw new ApiError(404, "Vendor profile not found")
    const priceEntry = vendor.pricing.find(
        p => p.paperSize === paperSize &&
            p.printType === printType
    )
    if (!priceEntry) throw new ApiError(400, "Vendor does not offer this print type")
   
    if (!paymentMethod) throw new ApiError(400, "Please select payment method")
    
    const filePath = req.file?.path;
    if (!filePath) throw new ApiError(400, "Please select file");
    const fileUpload = await uploadOnCloudinary(filePath)
    if (!fileUpload?.url) throw new ApiError(500, "File upload failed")


    const totalAmount = priceEntry.pricePerPage *
        pageCount *
        copies +
        platformFee
    const pickupToken = Math.floor(1000 + Math.random() * 9000).toString()
    const order = await Order.create({
        customerId: req.user._id,
        vendorId,
        fileUrl: fileUpload.url,
        fileName: req.file.originalname,
        fileType: req.file.mimetype.split("/")[1],
        pageCount,
        printConfig: { paperSize, printType, copies },
        totalAmount,
        platformFee,
        pickupToken,
        payment: {
            method: paymentMethod,
            status: "unpaid"
        }
        
    })
    return res
    .status(201)
    .json(new ApiResponse(201, order, "Order placed successfully"))
})

const getMyOrders =  asyncHandler(async(req, res) =>{
    const orders = await Order.find({ customerId: req.user._id })
    if(orders.length === 0) throw new ApiError(400, "You dont have any orders");

    return res
    .status(200)
    .json(new ApiResponse(200, orders, "Orders fetched successfully"))


})

const getVendorOrders = asyncHandler(async(req, res) => {
    const vendor = await VendorProfile.findOne({ userId: req.user._id })
    if(!vendor) throw new ApiError(404, "Vendor not found") 
    const orders = await Order.find({ vendorId: vendor._id })
    if(orders.length === 0) throw new ApiError(400, "You dont have any orders");
    return res
    .status(200)
    .json(new ApiResponse(200, orders, "Orders fetched successfully"))
})


const getOrderById = asyncHandler(async(req, res) => {
    const order  = await Order.findById(req.params.orderId)
    if(!order) throw new ApiError(400, "No order found by this ID")
    return res
    .status(200)
    .json(new ApiResponse(200, order, "Order found successfully"))

})


const updateOrderStatus = asyncHandler(async(req, res) => {
    const { status } = req.body
    const { orderId } = req.params

    const validStatus = ["accepted", "printing", "completed", "rejected"]
    if(!validStatus.includes(status)){
        throw new ApiError(400, "Invalid status")
    }

    const order = await Order.findById(orderId)
    if(!order) throw new ApiError(404, "Order not found")

    // Sirf vendor apna order update kar sake
    const vendor = await VendorProfile.findOne({ userId: req.user._id })
    if(!vendor) throw new ApiError(404, "Vendor not found")
    if(order.vendorId.toString() !== vendor._id.toString()){
        throw new ApiError(403, "Unauthorized")
    }

    order.status = status
    await order.save()

    return res
        .status(200)
        .json(new ApiResponse(200, order, `Order ${status} successfully`))
})

export {
    createOrder,
    getMyOrders,
    getVendorOrders,
    getOrderById,
    updateOrderStatus
}