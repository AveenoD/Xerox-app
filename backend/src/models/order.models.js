import mongoose, { Schema } from "mongoose";

const orderSchema = new Schema({
    customerId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    vendorId: {
        type: Schema.Types.ObjectId,
        ref: "VendorProfile",
        required: true
    },
    fileUrl: {
        type: String,
        required: true
    },
    fileName: {
        type: String,
        required: true,
        trim: true
    },
    fileType: {
        type: String,
        enum: ["pdf",  "jpg", "png"],
        required: true
    },
    pageCount: {
        type: Number,
        required: true,
        min: 1
    },
    printConfig: {
        paperSize: {
            type: String,
            enum: ["A4", "A3", "Legal"],
            required: true,
        },
        printType: {
            type: String,
            enum: ["bw_single", "bw_double",
                "color_single", "color_double"],
            required: true
        },
        copies: {
            type: Number,
            required: true,
            default: 1,
            min: 1
        }

    },
    platformFee: {
    type: Number,
    default: 0  // Phase 1 mein zero
},
    totalAmount: {
        type: Number,
        required: true
    },
    pickupToken: {
    type: String,
    default: null
},
    status: {
        type: String,
        enum: ["pending", "accepted",
            "printing", "completed", "rejected", "cancelled"],
        default: "pending"
    },
    cancelReason: {
        type: String,
        default: null
    },
    payment:{
        method:{
            type: String,
            enum: ["upi", "cash"],
            required: true
        },
        status:{
            type: String,
            enum: ["unpaid", "paid"],
            default: "unpaid"
        },
        razorpayOrderId:{
            type: String,
            default: null
        },
        razorpayPaymentId:{
            type: String,
            default: null
        }
    },
    bookingFee: {
        type: Number,
        default: 0
    },
    walletAmountUsed: {
        type: Number,
        default: 0
    },
    freePagesUsed: {
        type: Number,
        default: 0
    },
    finalAmount: {
        type: Number,
        default: 0
    },
    filePublicId: {
        type: String,
        default: null
    },
    fileDeletedAt: {
        type: Date,
        default: null
    }
}, {timestamps: true})

export const Order = mongoose.model("Order", orderSchema);