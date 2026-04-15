import mongoose from 'mongoose';

// Type augmentation for mongoose models
declare module 'mongoose' {
  interface Model<T> {
    createForUser(userId: mongoose.Types.ObjectId, signupTime: Date): Promise<T[]>;
  }
}
