import mongoose, { Schema } from 'mongoose'


const vendorSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true
    },
    shopName: {
        type: String,
        required: true,
        trim: true
    },
    address: {
        type: String,
        required: true,
        trim: true,
    },
    pincode: {
        type: String,
        required: true,
        trim: true,
    },
    city: {
        type: String,
        required: true,
        trim: true,
    },
    location: {
        type: {
            type: String,
            enum: ["Point"],
            default: "Point"
        },
        coordinates: {
            type: [Number],
            required: true
        }
    },
    shopPhoto: {
        type: String,
        default: null
    },
    isOpen: {
        type: Boolean,
        default: true
    },
    pricing: [{
        paperSize: {
            type: String,
            enum: ["A4", "A3", "Legal"],
            required: true
        },
        printType: {
            type: String,
            enum: ["bw_single", "bw_double", "color_single", "color_double"],
            required: true

        },
        pricePerPage: {
            type: Number,
            required: true
        }
    }],

    ratings: [{
        customerId: {
            type: Schema.Types.ObjectId,
            ref: "User",

        },
        score: {
            type: Number,
            min: 1,
            max: 5
        },
        review: {
            type: String,
            trim: true
        },
        createdAt: {
            type: Date,
            default: Date.now
        },

    }],
    averageRating: {
        type: Number,
        default: 0
    },
    plan:{
        type: String,
        enum: ["free", "basic", "premium"], 
        default: "free"
    },
    planExpiresAt:{
        type: Date,
        default: null
    }
}, { timestamps: true },);
vendorSchema.index({ location: "2dsphere" })

const VendorProfile = mongoose.model("VendorProfile", vendorSchema);

export default VendorProfile;