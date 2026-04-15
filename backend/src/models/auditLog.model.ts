import mongoose, { Schema, Document } from 'mongoose';

export interface IAuditLog extends Document {
  _id: mongoose.Types.ObjectId;
  adminId: mongoose.Types.ObjectId;
  action: string;
  targetType: 'user' | 'vendor' | 'order' | 'dispute' | 'subscription' | 'settings';
  targetId?: mongoose.Types.ObjectId;
  details: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    adminId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    action: {
      type: String,
      required: true,
      enum: [
        'user_blocked',
        'user_unblocked',
        'user_deleted',
        'vendor_approved',
        'vendor_suspended',
        'vendor_unsuspended',
        'vendor_permanent_ban',
        'strike_added',
        'strike_removed',
        'order_cancelled',
        'order_force_completed',
        'order_transferred',
        'dispute_resolved',
        'subscription_created',
        'subscription_cancelled',
        'subscription_plan_changed',
        'settings_updated',
        'vendor_pricing_changed',
        'refund_processed',
      ],
    },
    targetType: {
      type: String,
      enum: ['user', 'vendor', 'order', 'dispute', 'subscription', 'settings'],
      required: true,
    },
    targetId: {
      type: Schema.Types.ObjectId,
    },
    details: {
      type: Schema.Types.Mixed,
      default: {},
    },
    ipAddress: {
      type: String,
    },
    userAgent: {
      type: String,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Indexes
auditLogSchema.index({ adminId: 1, createdAt: -1 });
auditLogSchema.index({ action: 1 });
auditLogSchema.index({ targetType: 1, targetId: 1 });
auditLogSchema.index({ createdAt: -1 });

// Static method to log admin action
auditLogSchema.statics.log = async function (
  adminId: mongoose.Types.ObjectId,
  action: string,
  targetType: IAuditLog['targetType'],
  details: Record<string, unknown>,
  options?: {
    targetId?: mongoose.Types.ObjectId;
    ipAddress?: string;
    userAgent?: string;
  }
): Promise<IAuditLog> {
  return this.create({
    adminId,
    action,
    targetType,
    targetId: options?.targetId,
    details,
    ipAddress: options?.ipAddress,
    userAgent: options?.userAgent,
  });
};

const AuditLog = mongoose.model<IAuditLog>('AuditLog', auditLogSchema);

export default AuditLog;
