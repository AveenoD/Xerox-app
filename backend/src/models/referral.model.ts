import mongoose, { Schema, Document } from 'mongoose';

export interface IReferral extends Document {
  _id: mongoose.Types.ObjectId;
  referrerId: mongoose.Types.ObjectId;
  refereeId: mongoose.Types.ObjectId;
  referralCode: string;
  refereeSignupBonus: {
    amount: number;
    creditedAt: Date;
    expiresAt: Date;
  };
  refereeFirstOrderBonus: {
    amount: number;
    creditedAt: Date;
    orderId?: mongoose.Types.ObjectId;
  };
  referrerFirstOrderBonus: {
    amount: number;
    creditedAt: Date;
    orderId?: mongoose.Types.ObjectId;
  };
  status: 'pending_signup' | 'pending_first_order' | 'completed' | 'expired';
  createdAt: Date;
  updatedAt: Date;
}

const referralSchema = new Schema<IReferral>(
  {
    referrerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    refereeId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    referralCode: {
      type: String,
      required: true,
    },
    refereeSignupBonus: {
      amount: {
        type: Number,
        default: 10,
      },
      creditedAt: {
        type: Date,
      },
      expiresAt: {
        type: Date,
      },
    },
    refereeFirstOrderBonus: {
      amount: {
        type: Number,
        default: 0,
      },
      creditedAt: {
        type: Date,
      },
      orderId: {
        type: Schema.Types.ObjectId,
        ref: 'Order',
      },
    },
    referrerFirstOrderBonus: {
      amount: {
        type: Number,
        default: 0,
      },
      creditedAt: {
        type: Date,
      },
      orderId: {
        type: Schema.Types.ObjectId,
        ref: 'Order',
      },
    },
    status: {
      type: String,
      enum: ['pending_signup', 'pending_first_order', 'completed', 'expired'],
      default: 'pending_signup',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
referralSchema.index({ referrerId: 1 });
referralSchema.index({ refereeId: 1 });
referralSchema.index({ referralCode: 1 });
referralSchema.index({ status: 1 });

const Referral = mongoose.model<IReferral>('Referral', referralSchema);

export default Referral;
