import mongoose, { Schema } from 'mongoose'

const referralSchema = new Schema({
    // User A — jo refer kiya
    referrerId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // User B — jo referred hua
    refereeId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true  // ek user sirf ek baar refer ho sakta hai
    },
    referralCode: {
        type: String,
        required: true
    },
    // Step 1: referee ne signup + OTP verify kiya
    signupBonusCredited: {
        type: Boolean,
        default: false
    },
    // Step 2: referee ne pehla order place kiya → referrer ko bonus
    referralBonusCredited: {
        type: Boolean,
        default: false
    },
    firstOrderId: {
        type: Schema.Types.ObjectId,
        ref: 'Order',
        default: null
    },
    completedAt: {
        type: Date,
        default: null
    },
    bonusAmount: {
        type: Number,
        default: null
    }
}, { timestamps: true })

export const Referral = mongoose.model('Referral', referralSchema)