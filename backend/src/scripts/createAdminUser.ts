import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import User from '../models/user.model.js';
import Wallet from '../models/wallet.model.js';
import { USER_ROLES } from '../config/constants.js';
import { logger } from '../utils/logger.js';

const createAdminUser = async (): Promise<void> => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/xconnect');

    const adminEmail = process.argv[2] || 'admin@xconnect.app';
    const adminPassword = process.argv[3] || 'Admin@123';
    const adminName = process.argv[4] || 'Admin';

    // Check if admin exists
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (existingAdmin) {
      logger.info(`Admin user already exists: ${adminEmail}`);
      process.exit(0);
    }

    // Create admin user
    const admin = await User.create({
      fullName: adminName,
      email: adminEmail,
      password: adminPassword,
      phone: '+919999999999', // Placeholder
      role: USER_ROLES.ADMIN,
      isEmailVerified: true,
      emailVerifiedAt: new Date(),
      referralCode: 'XC-ADMIN001',
    });

    // Create wallet for admin
    await Wallet.create({
      userId: admin._id,
      balance: 0,
      promoBalance: 0,
      transactions: [],
    });

    logger.info(`Admin user created successfully!`);
    logger.info(`Email: ${adminEmail}`);
    logger.info(`Password: ${adminPassword}`);
    logger.info(`Role: ${USER_ROLES.ADMIN}`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    logger.error('Error creating admin:', error);
    process.exit(1);
  }
};

createAdminUser();
