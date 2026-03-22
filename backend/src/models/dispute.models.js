import mongoose, { Schema } from 'mongoose'

const disputeSchema = new Schema({
    orderId: {
        type: Schema.Types.ObjectId,
        ref: 'Order',
        required: true
    },
    customerId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    vendorId: {
        type: Schema.Types.ObjectId,
        ref: 'VendorProfile',
        required: true
    },
    reason: {
        type: String,
        enum: [
            'wrong_print',
            'missing_pages',
            'quality_issue',
            'wrong_copies',
            'not_received',
            'other'
        ],
        required: true
    },
    description: {
        type: String,
        maxlength: 500
    },
    status: {
        type: String,
        enum: ['open', 'under_review', 'resolved', 'rejected'],
        default: 'open'
    },
    resolution: {
        type: String,
        default: null
    },
    resolvedAt: {
        type: Date,
        default: null
    }
}, { timestamps: true })

export const Dispute = mongoose.model('Dispute', disputeSchema)