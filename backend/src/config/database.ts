import mongoose from 'mongoose';
import { logger } from '../utils/logger.js';

const connectDB = async (): Promise<void> => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/xconnect';

    const conn = await mongoose.connect(mongoURI);

    logger.info(`MongoDB Connected: ${conn.connection.host}`);

    // Create indexes
    await createIndexes();

  } catch (error) {
    logger.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const createIndexes = async (): Promise<void> => {
  try {
    const db = mongoose.connection.db;
    if (!db) return;

    // User indexes
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    await db.collection('users').createIndex({ phone: 1 }, { unique: true });
    await db.collection('users').createIndex({ referralCode: 1 }, { unique: true });
    await db.collection('users').createIndex({ location: '2dsphere' });

    // Vendor indexes
    await db.collection('vendorprofiles').createIndex({ userId: 1 }, { unique: true });
    await db.collection('vendorprofiles').createIndex({ location: '2dsphere' });
    await db.collection('vendorprofiles').createIndex({ isOpen: 1 });
    await db.collection('vendorprofiles').createIndex({ status: 1 });
    await db.collection('vendorprofiles').createIndex({ plan: 1 });

    // Order indexes
    await db.collection('orders').createIndex({ orderId: 1 }, { unique: true });
    await db.collection('orders').createIndex({ customerId: 1 });
    await db.collection('orders').createIndex({ vendorId: 1 });
    await db.collection('orders').createIndex({ status: 1 });
    await db.collection('orders').createIndex({ slaDeadline: 1 });
    await db.collection('orders').createIndex({ createdAt: -1 });
    await db.collection('orders').createIndex({ pickupToken: 1 });
    await db.collection('orders').createIndex({ fileDeleteAt: 1 });

    // Wallet indexes
    await db.collection('wallets').createIndex({ userId: 1 }, { unique: true });

    // Referral indexes
    await db.collection('referrals').createIndex({ referrerId: 1 });
    await db.collection('referrals').createIndex({ refereeId: 1 });
    await db.collection('referrals').createIndex({ referralCode: 1 });

    // Challenge indexes
    await db.collection('challenges').createIndex({ userId: 1 });
    await db.collection('challenges').createIndex({ challengeType: 1 });
    await db.collection('challenges').createIndex({ status: 1 });

    // Spin records indexes
    await db.collection('spinrecords').createIndex({ userId: 1 });
    await db.collection('spinrecords').createIndex({ createdAt: -1 });

    // Subscription indexes
    await db.collection('subscriptions').createIndex({ vendorId: 1 });
    await db.collection('subscriptions').createIndex({ status: 1 });
    await db.collection('subscriptions').createIndex({ nextBillingDate: 1 });

    // Dispute indexes
    await db.collection('disputes').createIndex({ orderId: 1 });
    await db.collection('disputes').createIndex({ status: 1 });

    // Audit log indexes
    await db.collection('auditlogs').createIndex({ adminId: 1 });
    await db.collection('auditlogs').createIndex({ action: 1 });
    await db.collection('auditlogs').createIndex({ createdAt: -1 });

    logger.info('Database indexes created successfully');
  } catch (error) {
    logger.error('Error creating indexes:', error);
  }
};

export default connectDB;
