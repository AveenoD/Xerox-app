import mongoose, { Schema } from 'mongoose'

const PLAN_LIMITS = {
    starter: 30,
    growth: 200,
    pro: Infinity
}

const vendorPlanSchema = new Schema({
    vendorId: {
        type: Schema.Types.ObjectId,
        ref: 'VendorProfile',
        required: true,
        unique: true,
        index: true
    },
    plan: {
        type: String,
        enum: ['starter', 'growth', 'pro'],
        default: 'starter',
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'cancelled', 'past_due'],
        default: 'active'
    },
    ordersUsedThisMonth: {
        type: Number,
        default: 0,
        min: 0
    },
    currentPeriodStart: {
        type: Date,
        default: Date.now
    },
    currentPeriodEnd: {
        type: Date,
        required: true
    },
    // Track order history for analytics
    monthlyOrderHistory: [{
        month: String, // Format: "2024-01"
        ordersUsed: Number,
        plan: String
    }]
}, { timestamps: true })

// Pre-save middleware to auto-calculate period end if not set
vendorPlanSchema.pre('save', function(next) {
    if (!this.currentPeriodEnd) {
        // Set period end to 1 month from start
        const endDate = new Date(this.currentPeriodStart)
        endDate.setMonth(endDate.getMonth() + 1)
        this.currentPeriodEnd = endDate
    }
    next()
})

// Instance method to check if plan limit is reached
vendorPlanSchema.methods.isLimitReached = function() {
    const limit = PLAN_LIMITS[this.plan]
    if (limit === Infinity) return false
    return this.ordersUsedThisMonth >= limit
}

// Instance method to get remaining orders
vendorPlanSchema.methods.getRemainingOrders = function() {
    const limit = PLAN_LIMITS[this.plan]
    if (limit === Infinity) return 'Unlimited'
    return Math.max(0, limit - this.ordersUsedThisMonth)
}

// Instance method to increment order count
vendorPlanSchema.methods.incrementOrderCount = async function() {
    this.ordersUsedThisMonth += 1
    await this.save()
}

// Instance method to reset monthly counter
vendorPlanSchema.methods.resetMonthlyCounter = async function() {
    // Save current month to history
    const currentMonth = new Date().toISOString().slice(0, 7) // "2024-01"
    this.monthlyOrderHistory.push({
        month: currentMonth,
        ordersUsed: this.ordersUsedThisMonth,
        plan: this.plan
    })
    
    // Reset counter and update period
    this.ordersUsedThisMonth = 0
    this.currentPeriodStart = new Date()
    const endDate = new Date()
    endDate.setMonth(endDate.getMonth() + 1)
    this.currentPeriodEnd = endDate
    
    await this.save()
}

// Static method to get plan limits
vendorPlanSchema.statics.getPlanLimits = function() {
    return PLAN_LIMITS
}

// Static method to create plan for new vendor
vendorPlanSchema.statics.createForVendor = async function(vendorId, plan = 'starter') {
    const periodEnd = new Date()
    periodEnd.setMonth(periodEnd.getMonth() + 1)
    
    return await this.create({
        vendorId,
        plan,
        status: 'active',
        ordersUsedThisMonth: 0,
        currentPeriodEnd: periodEnd
    })
}

export const VendorPlan = mongoose.model('VendorPlan', vendorPlanSchema)
export { PLAN_LIMITS }
