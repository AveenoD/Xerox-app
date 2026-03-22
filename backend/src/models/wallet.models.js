import mongoose, { Schema } from 'mongoose'

const transactionSchema = new Schema({
    type: {
        type: String,
        enum: [
            'signup_bonus',
            'referral_bonus',
            'referee_bonus',
            'refund',
            'debit',
            'booking_fee',
        ],
        required: true
    },
    amount: { type: Number, required: true },
    balanceType: {
        type: String,
        enum: ['promotional', 'refunded'],
        required: true
    },
    description: { type: String },
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', default: null },
    expiresAt: { type: Date, default: null },
    isExpired: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
})

const walletSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    // Promotional: signup bonus, referral bonus — 7 day expiry
    promotionalBalance: { type: Number, default: 0, min: 0 },
    // Refunded: from cancelled orders — no expiry
    refundedBalance: { type: Number, default: 0, min: 0 },
    transactions: [transactionSchema]
}, { timestamps: true })

walletSchema.virtual('totalBalance').get(function () {
    return this.promotionalBalance + this.refundedBalance
})

// Add promotional credit (7 day expiry)
walletSchema.methods.addPromoCredit = async function (amount, type, description, orderId = null, session = null) {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    this.promotionalBalance += amount
    this.transactions.push({ type, amount, balanceType: 'promotional', description, orderId, expiresAt })
    return session ? this.save({ session }) : this.save()
}

// Add refunded credit (no expiry)
walletSchema.methods.addRefundCredit = async function (amount, orderId, description, session = null) {
    this.refundedBalance += amount
    this.transactions.push({ type: 'refund', amount, balanceType: 'refunded', description, orderId, expiresAt: null })
    return session ? this.save({ session }) : this.save()
}

// Debit from wallet
// Strategy: promotional first (expires soon), then refunded
// FIX: accepts session for MongoDB transaction atomicity
walletSchema.methods.debit = async function (amount, orderId, description, session = null) {
    const total = this.promotionalBalance + this.refundedBalance
    if (total < amount) throw new Error('Insufficient wallet balance')

    let remaining = amount

    // Use promotional balance first (it expires — use it before it's gone)
    if (this.promotionalBalance >= remaining) {
        this.promotionalBalance -= remaining
        remaining = 0
    } else {
        remaining -= this.promotionalBalance
        this.promotionalBalance = 0
        // Then use refunded balance
        this.refundedBalance -= remaining
        remaining = 0
    }

    this.transactions.push({
        type: 'debit',
        amount,
        balanceType: 'promotional',
        description,
        orderId,
        expiresAt: null
    })

    // FIXED: pass session so this save is part of the MongoDB transaction
    return session ? this.save({ session }) : this.save()
}

export const Wallet = mongoose.model('Wallet', walletSchema)