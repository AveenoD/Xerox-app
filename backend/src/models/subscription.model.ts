import mongoose, { Schema, Document } from 'mongoose';

export interface ISubscription extends Document {
  _id: mongoose.Types.ObjectId;
  vendorId: mongoose.Types.ObjectId;
  plan: 'starter' | 'growth' | 'premium';
  status: 'active' | 'cancelled' | 'expired' | 'trial';
  startDate: Date;
  endDate: Date;
  nextBillingDate?: Date;
  monthlyAmount: number;
  paymentId?: string;
  cancelAtPeriodEnd: boolean;
  cancelledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const subscriptionSchema = new Schema<ISubscription>(
  {
    vendorId: {
      type: Schema.Types.ObjectId,
      ref: 'VendorProfile',
      required: true,
    },
    plan: {
      type: String,
      enum: ['starter', 'growth', 'premium'],
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'cancelled', 'expired', 'trial'],
      default: 'trial',
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    nextBillingDate: {
      type: Date,
    },
    monthlyAmount: {
      type: Number,
      required: true,
    },
    paymentId: {
      type: String,
    },
    cancelAtPeriodEnd: {
      type: Boolean,
      default: false,
    },
    cancelledAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
subscriptionSchema.index({ vendorId: 1 });
subscriptionSchema.index({ status: 1 });
subscriptionSchema.index({ nextBillingDate: 1 });

// Check if subscription is active
subscriptionSchema.virtual('isActive').get(function () {
  return (
    (this.status === 'active' || this.status === 'trial') &&
    new Date() < this.endDate
  );
});

// Static to get active subscription for vendor
subscriptionSchema.statics.getActiveForVendor = async function (
  vendorId: mongoose.Types.ObjectId
): Promise<ISubscription | null> {
  return this.findOne({
    vendorId,
    status: { $in: ['active', 'trial'] },
    endDate: { $gt: new Date() },
  });
};

const Subscription = mongoose.model<ISubscription>('Subscription', subscriptionSchema);

export default Subscription;
