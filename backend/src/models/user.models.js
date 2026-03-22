import mongoose, { Schema } from 'mongoose';
import jwt from 'jsonwebtoken';
import bcrypt from "bcrypt";
import crypto from 'crypto'
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

    },
    refreshToken: {
        type: String
    },
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    emailOtp: {
        type: String,
        default: null
    },
    emailOtpExpiry: {
        type: Date,
        default: null
    },
    phoneOtp: {
        type: String,
        default: null
    },
    phoneOtpExpiry: {
        type: Date,
        default: null
    },
    otpAttempts: {
        type: Number,
        default: 0
    },
    otpLockUntil: {
        type: Date,
        default: null
    },
    referralCode: {
        type: String,
        unique: true,
        sparse: true
    },
    referredBy: {
        type: String,
        default: null
    },

    // Bonuses
    signupBonusCredited: {
        type: Boolean,
        default: false
    },
    freePages: {
        type: Number,
        default: 50
    },

    // Phone verification (agar nahi hai toh)
    isPhoneVerified: {
        type: Boolean,
        default: false
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

userSchema.pre('save', async function (next) {
    if (this.isModified('password')) {
        this.password = await bcrypt.hash(this.password, 10)
    }
    // Referral code auto generate
    if (!this.referralCode) {
        this.referralCode = 'XC' + crypto.randomBytes(3)
            .toString('hex').toUpperCase()
    }
})

userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password);
}

userSchema.methods.generateAccessToken = function () {
    return jwt.sign({
        _id: this._id,
        fullName: this.fullName
    },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

userSchema.methods.generateRefreshToken = function () {
    return jwt.sign({
        _id: this._id,
    },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}


export const User = mongoose.model("User", userSchema);

