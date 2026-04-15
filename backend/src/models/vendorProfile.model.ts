import mongoose, { Schema, Document, Types } from 'mongoose';
import { VENDOR_STATUS, SLA_CONFIG } from '../config/constants.js';

export interface IPricing {
  bw_single: number;
  bw_double: number;
  color_single: number;
  color_double: number;
}

export interface IPricingMatrix {
  A4: IPricing;
  A3: IPricing;
  Legal: IPricing;
}

export interface IStrikeRecord {
  reason: string;
  orderId?: Types.ObjectId;
  timestamp: Date;
  slaMinutes: number;
  addedBy?: 'system' | 'admin';
}

export interface ILocation {
  type: 'Point';
  coordinates: [number, number];
}

export interface IVendorProfile extends Document {
  userId: Types.ObjectId;
  shopName: string;
  shopAddress: string;
  shopPhoto?: string;
  location: ILocation;
  isOpen: boolean;
  pricing: IPricingMatrix;
  plan: 'trial' | 'starter' | 'growth' | 'premium';
  trialEndsAt: Date;
  subscriptionEndsAt?: Date;
  slaMinutes: number;
  strikes: number;
  strikeHistory: IStrikeRecord[];
  totalOrders: number;
  completedOrders: number;
  averageRating: number;
  totalRatings: number;
  status: string;
  suspendedUntil?: Date;
  suspendReason?: string;
  isVerified: boolean;
  verifiedAt?: Date;
  getSlaMinutes(): number;
  canReceiveOrders(): boolean;
  addStrike(
    reason: string,
    orderId?: Types.ObjectId,
    addedBy?: 'system' | 'admin'
  ): Promise<IVendorProfile>;
}

const vendorProfileSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  shopName: {
    type: String,
    required: [true, 'Shop name is required'],
    trim: true,
  },
  shopAddress: {
    type: String,
    required: [true, 'Shop address is required'],
    trim: true,
  },
  shopPhoto: {
    type: String,
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number],
      required: [true, 'Location coordinates are required'],
    },
  },
  isOpen: {
    type: Boolean,
    default: true,
  },
  pricing: {
    A4: {
      bw_single: { type: Number, default: 2, min: 0 },
      bw_double: { type: Number, default: 3, min: 0 },
      color_single: { type: Number, default: 10, min: 0 },
      color_double: { type: Number, default: 15, min: 0 },
    },
    A3: {
      bw_single: { type: Number, default: 5, min: 0 },
      bw_double: { type: Number, default: 8, min: 0 },
      color_single: { type: Number, default: 20, min: 0 },
      color_double: { type: Number, default: 30, min: 0 },
    },
    Legal: {
      bw_single: { type: Number, default: 3, min: 0 },
      bw_double: { type: Number, default: 5, min: 0 },
      color_single: { type: Number, default: 15, min: 0 },
      color_double: { type: Number, default: 20, min: 0 },
    },
  },
  plan: {
    type: String,
    enum: ['trial', 'starter', 'growth', 'premium'],
    default: 'trial',
  },
  trialEndsAt: {
    type: Date,
    required: true,
  },
  subscriptionEndsAt: {
    type: Date,
  },
  slaMinutes: {
    type: Number,
    default: SLA_CONFIG.TRIAL,
    min: 1,
    max: 10,
  },
  strikes: {
    type: Number,
    default: 0,
    min: 0,
  },
  strikeHistory: [
    {
      reason: { type: String, required: true },
      orderId: { type: Schema.Types.ObjectId, ref: 'Order' },
      timestamp: { type: Date, default: Date.now },
      slaMinutes: { type: Number },
      addedBy: {
        type: String,
        enum: ['system', 'admin'],
        default: 'system',
      },
    },
  ],
  totalOrders: {
    type: Number,
    default: 0,
  },
  completedOrders: {
    type: Number,
    default: 0,
  },
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5,
  },
  totalRatings: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: Object.values(VENDOR_STATUS),
    default: VENDOR_STATUS.PENDING_APPROVAL,
  },
  suspendedUntil: {
    type: Date,
  },
  suspendReason: {
    type: String,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  verifiedAt: {
    type: Date,
  },
}, {
  timestamps: true,
});

// Indexes
vendorProfileSchema.index({ location: '2dsphere' });
vendorProfileSchema.index({ isOpen: 1, status: 1 });
vendorProfileSchema.index({ plan: 1 });
vendorProfileSchema.index({ averageRating: -1 });

// Get SLA minutes
vendorProfileSchema.methods.getSlaMinutes = function (): number {
  if (this.plan === 'trial') return SLA_CONFIG.TRIAL;
  if (this.plan === 'starter') return SLA_CONFIG.STARTER;
  if (this.plan === 'growth') return SLA_CONFIG.GROWTH;
  if (this.plan === 'premium') return SLA_CONFIG.PREMIUM;
  return SLA_CONFIG.DEFAULT;
};

// Check if vendor can receive orders
vendorProfileSchema.methods.canReceiveOrders = function (): boolean {
  if (this.status === 'suspended') {
    if (this.suspendedUntil && this.suspendedUntil > new Date()) {
      return false;
    }
  }
  return this.status === 'active' && this.isOpen;
};

// Add strike
vendorProfileSchema.methods.addStrike = async function (
  reason: string,
  orderId?: Types.ObjectId,
  addedBy: 'system' | 'admin' = 'system'
): Promise<IVendorProfile> {
  this.strikeHistory.push({
    reason,
    orderId,
    timestamp: new Date(),
    slaMinutes: this.slaMinutes,
    addedBy,
  });
  this.strikes = this.strikeHistory.length;
  await this.save();
  return this as unknown as IVendorProfile;
};

const VendorProfile = mongoose.model<IVendorProfile>('VendorProfile', vendorProfileSchema);

export default VendorProfile;
