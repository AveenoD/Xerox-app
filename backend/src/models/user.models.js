import mongoose, { Schema } from 'mongoose';
import jwt from 'jsonwebtoken';
import bcrypt from "bcrypt";

const userSchema = new Schema({
    fullName: {
        type: String,
        required: true,
        trim: true,

    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: [true, "Password is required"]

    },
    avatar: {
        type: String,

    },
    phone: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ["customer", "vendor"],
        default: "customer",
        default: null
    },
    refreshToken: {
        type: String
    },
    vendorProfileId: {
        type: Schema.Types.ObjectId,
        ref: "VendorProfile",
        default: null
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });


export const User = mongoose.model("User", userSchema);
