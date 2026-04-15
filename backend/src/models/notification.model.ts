import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  type: 'order_update' | 'promotion' | 'challenge' | 'referral' | 'system';
  title: string;
  message: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['order_update', 'promotion', 'challenge', 'referral', 'system'],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    data: {
      type: Schema.Types.Mixed,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, isRead: 1 });
notificationSchema.index({ createdAt: -1 });

// Mark as read
notificationSchema.methods.markAsRead = async function (): Promise<void> {
  this.isRead = true;
  this.readAt = new Date();
  await this.save();
};

// Static to create notification
notificationSchema.statics.createNotification = async function (
  userId: mongoose.Types.ObjectId,
  type: INotification['type'],
  title: string,
  message: string,
  data?: Record<string, unknown>
): Promise<INotification> {
  return this.create({
    userId,
    type,
    title,
    message,
    data,
  });
};

// Get unread count
notificationSchema.statics.getUnreadCount = async function (
  userId: mongoose.Types.ObjectId
): Promise<number> {
  return this.countDocuments({ userId, isRead: false });
};

const Notification = mongoose.model<INotification>('Notification', notificationSchema);

export default Notification;
