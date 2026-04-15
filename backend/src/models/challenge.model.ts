import mongoose, { Schema, Document, Types } from 'mongoose';

export type ChallengeType = 'first_print' | 'early_bird' | 'consistent_user';
export type ChallengeStatus = 'active' | 'completed' | 'expired';

export interface IChallenge extends Document {
  userId: Types.ObjectId;
  challengeType: ChallengeType;
  status: ChallengeStatus;
  progress: number;
  target: number;
  rewardAmount: number;
  rewardCredited: boolean;
  completedAt?: Date;
  expiresAt: Date;
  updateProgress(increment?: number): Promise<boolean>;
}

const challengeSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  challengeType: {
    type: String,
    enum: ['first_print', 'early_bird', 'consistent_user'] as const,
    required: true,
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'expired'] as const,
    default: 'active',
  },
  progress: {
    type: Number,
    default: 0,
  },
  target: {
    type: Number,
    required: true,
  },
  rewardAmount: {
    type: Number,
    required: true,
  },
  rewardCredited: {
    type: Boolean,
    default: false,
  },
  completedAt: {
    type: Date,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
}, {
  timestamps: true,
});

// Indexes
challengeSchema.index({ userId: 1, challengeType: 1 }, { unique: true });
challengeSchema.index({ status: 1 });
challengeSchema.index({ expiresAt: 1 });

// Update progress
challengeSchema.methods.updateProgress = async function (increment = 1): Promise<boolean> {
  this.progress += increment;

  if (this.progress >= this.target) {
    this.status = 'completed';
    this.completedAt = new Date();
  }

  await this.save();
  return this.status === 'completed';
};

// Static method to create challenges for new user
challengeSchema.statics.createForUser = async function (
  userId: Types.ObjectId,
  signupTime: Date
): Promise<IChallenge[]> {
  const challenges = [
    {
      userId,
      challengeType: 'first_print' as const,
      target: 1,
      rewardAmount: 10,
      expiresAt: new Date(signupTime.getTime() + 365 * 24 * 60 * 60 * 1000),
    },
    {
      userId,
      challengeType: 'early_bird' as const,
      target: 1,
      rewardAmount: 5,
      expiresAt: new Date(signupTime.getTime() + 24 * 60 * 60 * 1000),
    },
    {
      userId,
      challengeType: 'consistent_user' as const,
      target: 3,
      rewardAmount: 5,
      expiresAt: new Date(signupTime.getTime() + 30 * 24 * 60 * 60 * 1000),
    },
  ];

  return this.insertMany(challenges);
};

const Challenge = mongoose.model<IChallenge>('Challenge', challengeSchema);

export default Challenge;
