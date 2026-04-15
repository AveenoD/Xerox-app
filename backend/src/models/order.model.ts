import mongoose, { Schema, Document, Types } from 'mongoose';
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';
import {
  ORDER_STATUS,
  PAYMENT_STATUS,
  PAYMENT_METHOD,
  FILE_CONFIG,
} from '../config/constants.js';

export interface IPrintConfig {
  paperSize: 'A4' | 'A3' | 'Legal';
  printType: 'bw_single' | 'bw_double' | 'color_single' | 'color_double';
  copies: number;
}

export interface IStatusHistory {
  status: string;
  timestamp: Date;
  note?: string;
}

export interface IChallengeTracking {
  firstOrder: boolean;
  consistentUser: boolean;
}

export interface IOrder extends Document {
  orderId: string;
  customerId: Types.ObjectId;
  vendorId: Types.ObjectId;
  fileName: string;
  fileUrl: string;
  previewUrl: string;
  pageCount: number;
  originalFileSize: number;
  printConfig: IPrintConfig;
  printCost: number;
  platformFee: number;
  totalAmount: number;
  status: string;
  statusHistory: IStatusHistory[];
  slaDeadline: Date;
  slaAcceptedAt?: Date;
  slaBreached: boolean;
  pickupToken: string;
  estimatedReadyTime?: Date;
  actualReadyTime?: Date;
  paymentStatus: string;
  paymentMethod: string;
  vendorNotes?: string;
  customerNotes?: string;
  fileDeleteAt: Date;
  keepForFuture: boolean;
  countedForChallenge: IChallengeTracking;
}

const orderSchema = new Schema({
  orderId: {
    type: String,
    required: true,
    unique: true,
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
  fileName: {
    type: String,
    required: [true, 'File name is required'],
  },
  fileUrl: {
    type: String,
    required: [true, 'File URL is required'],
  },
  previewUrl: {
    type: String,
  },
  pageCount: {
    type: Number,
    required: [true, 'Page count is required'],
    min: [1, 'At least 1 page required'],
  },
  originalFileSize: {
    type: Number,
    required: true,
  },
  printConfig: {
    paperSize: {
      type: String,
      enum: ['A4', 'A3', 'Legal'],
      default: 'A4',
    },
    printType: {
      type: String,
      enum: ['bw_single', 'bw_double', 'color_single', 'color_double'],
      default: 'bw_single',
    },
    copies: {
      type: Number,
      default: 1,
      min: 1,
      max: 10,
    },
  },
  printCost: {
    type: Number,
    required: true,
    min: 0,
  },
  platformFee: {
    type: Number,
    required: true,
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0,
  },
  status: {
    type: String,
    enum: Object.values(ORDER_STATUS),
    default: ORDER_STATUS.PENDING,
  },
  statusHistory: [
    {
      status: { type: String, required: true },
      timestamp: { type: Date, default: Date.now },
      note: { type: String },
    },
  ],
  slaDeadline: {
    type: Date,
    required: true,
  },
  slaAcceptedAt: {
    type: Date,
  },
  slaBreached: {
    type: Boolean,
    default: false,
  },
  pickupToken: {
    type: String,
    required: true,
  },
  estimatedReadyTime: {
    type: Date,
  },
  actualReadyTime: {
    type: Date,
  },
  paymentStatus: {
    type: String,
    enum: Object.values(PAYMENT_STATUS),
    default: PAYMENT_STATUS.PENDING,
  },
  paymentMethod: {
    type: String,
    enum: Object.values(PAYMENT_METHOD),
    default: PAYMENT_METHOD.WALLET,
  },
  vendorNotes: {
    type: String,
    maxlength: [500, 'Notes cannot exceed 500 characters'],
  },
  customerNotes: {
    type: String,
    maxlength: [500, 'Notes cannot exceed 500 characters'],
  },
  fileDeleteAt: {
    type: Date,
    required: true,
  },
  keepForFuture: {
    type: Boolean,
    default: false,
  },
  countedForChallenge: {
    firstOrder: {
      type: Boolean,
      default: false,
    },
    consistentUser: {
      type: Boolean,
      default: false,
    },
  },
}, {
  timestamps: true,
});

// Pagination plugin
orderSchema.plugin(mongooseAggregatePaginate);

// Indexes
orderSchema.index({ customerId: 1, status: 1 });
orderSchema.index({ vendorId: 1, status: 1 });
orderSchema.index({ slaDeadline: 1, status: 1 });
orderSchema.index({ fileDeleteAt: 1, keepForFuture: 1 });
orderSchema.index({ pickupToken: 1 });

const Order = mongoose.model<IOrder>('Order', orderSchema);

export default Order;
