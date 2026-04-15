import mongoose, { Schema, Document } from 'mongoose';
import { DISPUTE_STATUS } from '../config/constants.js';

export interface IDispute extends Document {
  _id: mongoose.Types.ObjectId;
  orderId: mongoose.Types.ObjectId;
  customerId: mongoose.Types.ObjectId;
  vendorId: mongoose.Types.ObjectId;
  raisedBy: 'customer' | 'vendor';
  reason: string;
  description: string;
  evidence?: string[];
  status: 'open' | 'under_review' | 'resolved' | 'escalated';
  resolution?: {
    type: 'full_refund' | 'partial_refund' | 'no_refund' | 'credit_to_vendor';
    amount?: number;
    resolvedBy: mongoose.Types.ObjectId;
    note?: string;
    resolvedAt: Date;
  };
  adminNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const disputeSchema = new Schema<IDispute>(
  {
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    vendorId: {
      type: Schema.Types.ObjectId,
      ref: 'VendorProfile',
      required: true,
    },
    raisedBy: {
      type: String,
      enum: ['customer', 'vendor'],
      required: true,
    },
    reason: {
      type: String,
      required: [true, 'Dispute reason is required'],
      enum: [
        'quality_issue',
        'wrong_pages',
        'not_delivered',
        'overcharging',
        'vendor_unresponsive',
        'late_delivery',
        'other',
      ],
    },
    description: {
      type: String,
      required: [true, 'Please describe the issue'],
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    evidence: [
      {
        type: String,
      },
    ],
    status: {
      type: String,
      enum: Object.values(DISPUTE_STATUS),
      default: DISPUTE_STATUS.OPEN,
    },
    resolution: {
      type: {
        type: String,
        enum: ['full_refund', 'partial_refund', 'no_refund', 'credit_to_vendor'],
      },
      amount: {
        type: Number,
      },
      resolvedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
      note: {
        type: String,
      },
      resolvedAt: {
        type: Date,
      },
    },
    adminNotes: {
      type: String,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
disputeSchema.index({ orderId: 1 });
disputeSchema.index({ customerId: 1 });
disputeSchema.index({ vendorId: 1 });
disputeSchema.index({ status: 1 });
disputeSchema.index({ createdAt: -1 });

const Dispute = mongoose.model<IDispute>('Dispute', disputeSchema);

export default Dispute;
