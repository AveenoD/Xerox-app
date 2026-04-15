import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ISpinResult {
  type: 'wallet_bonus' | 'commission_free' | 'discount' | 'free_spin';
  value: number;
  label: string;
}

export interface ISpinRecord extends Document {
  userId: Types.ObjectId;
  spinCost: number;
  result: ISpinResult;
  spinType: 'paid' | 'ad_watched';
  adWatched: boolean;
  dailySpinsUsed: number;
}

const spinRecordSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  spinCost: {
    type: Number,
    required: true,
    default: 1,
  },
  result: {
    type: {
      type: String,
      enum: ['wallet_bonus', 'commission_free', 'discount', 'free_spin'] as const,
      required: true,
    },
    value: {
      type: Number,
      required: true,
    },
    label: {
      type: String,
      required: true,
    },
  },
  spinType: {
    type: String,
    enum: ['paid', 'ad_watched'] as const,
    default: 'paid',
  },
  adWatched: {
    type: Boolean,
    default: false,
  },
  dailySpinsUsed: {
    type: Number,
    default: 1,
  },
}, {
  timestamps: true,
});

// Indexes
spinRecordSchema.index({ userId: 1, createdAt: -1 });
spinRecordSchema.index({ createdAt: -1 });

// Get today's spins for a user
spinRecordSchema.statics.getTodaySpins = async function (
  userId: Types.ObjectId
): Promise<number> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const count = await this.countDocuments({
    userId,
    createdAt: { $gte: startOfDay },
  });

  return count;
};

// Get today's total reward cost
spinRecordSchema.statics.getTodayRewardCost = async function (
  userId: Types.ObjectId
): Promise<number> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const spins = await this.find({
    userId,
    createdAt: { $gte: startOfDay },
  });

  return spins.reduce((total: number, spin: ISpinRecord) => {
    if (spin.result.type === 'wallet_bonus') {
      return total + spin.result.value;
    }
    return total;
  }, 0);
};

const SpinRecord = mongoose.model<ISpinRecord>('SpinRecord', spinRecordSchema);

export default SpinRecord;
