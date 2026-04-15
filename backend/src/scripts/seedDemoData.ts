import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import User from '../models/user.model.js';
import VendorProfile from '../models/vendorProfile.model.js';
import Wallet from '../models/wallet.model.js';
import Challenge from '../models/challenge.model.js';
import { USER_ROLES, VENDOR_STATUS, WALLET_CONFIG } from '../config/constants.js';
import { logger } from '../utils/logger.js';

const seedDemoData = async (): Promise<void> => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/xconnect');

    logger.info('Seeding demo data...');

    // Create demo users
    const demoUsers = [
      { name: 'Rahul Sharma', email: 'rahul@gmail.com', phone: '+919876543210' },
      { name: 'Priya Patel', email: 'priya@yahoo.com', phone: '+919876543211' },
      { name: 'Amit Kumar', email: 'amit@outlook.com', phone: '+919876543212' },
    ];

    for (const userData of demoUsers) {
      const existing = await User.findOne({ email: userData.email });
      if (existing) {
        logger.info(`User ${userData.email} already exists`);
        continue;
      }

      const user = await User.create({
        fullName: userData.name,
        email: userData.email,
        password: 'Demo@123',
        phone: userData.phone,
        role: USER_ROLES.USER,
        isEmailVerified: true,
        emailVerifiedAt: new Date(),
        referralCode: `XC${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        walletBalance: 100,
        promoBalance: WALLET_CONFIG.SIGNUP_BONUS,
      });

      await Wallet.create({
        userId: user._id,
        balance: 100,
        promoBalance: WALLET_CONFIG.SIGNUP_BONUS,
        transactions: [
          {
            type: 'credit',
            amount: 100,
            source: 'topup',
            description: 'Demo balance',
            balanceAfter: 100,
          },
          {
            type: 'credit',
            amount: WALLET_CONFIG.SIGNUP_BONUS,
            source: 'signup_bonus',
            description: 'Welcome bonus',
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            balanceAfter: 100 + WALLET_CONFIG.SIGNUP_BONUS,
          },
        ],
      });

      await Challenge.createForUser(user._id, new Date());

      logger.info(`Created user: ${userData.email}`);
    }

    // Create demo vendors
    const demoVendors = [
      {
        name: 'Ravi Print Shop',
        email: 'ravi@gmail.com',
        phone: '+919876543220',
        address: 'Shop 1, Sector 15, Noida',
        coordinates: [77.3717, 28.5744] as [number, number],
        pricing: {
          A4: { bw_single: 2, bw_double: 3, color_single: 10, color_double: 15 },
          A3: { bw_single: 5, bw_double: 8, color_single: 20, color_double: 30 },
          Legal: { bw_single: 3, bw_double: 5, color_single: 15, color_double: 20 },
        },
      },
      {
        name: 'Quick Copies',
        email: 'quick@gmail.com',
        phone: '+919876543221',
        address: 'Shop 5, Sector 22, Noida',
        coordinates: [77.3817, 28.5644] as [number, number],
        pricing: {
          A4: { bw_single: 3, bw_double: 4, color_single: 12, color_double: 18 },
          A3: { bw_single: 6, bw_double: 10, color_single: 25, color_double: 35 },
          Legal: { bw_single: 4, bw_double: 6, color_single: 18, color_double: 24 },
        },
      },
    ];

    for (const vendorData of demoVendors) {
      const existing = await User.findOne({ email: vendorData.email });
      if (existing) {
        logger.info(`Vendor ${vendorData.email} already exists`);
        continue;
      }

      const user = await User.create({
        fullName: vendorData.name,
        email: vendorData.email,
        password: 'Demo@123',
        phone: vendorData.phone,
        role: USER_ROLES.VENDOR,
        isEmailVerified: true,
        emailVerifiedAt: new Date(),
      });

      const trialEndsAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      await VendorProfile.create({
        userId: user._id,
        shopName: vendorData.name,
        shopAddress: vendorData.address,
        location: {
          type: 'Point',
          coordinates: vendorData.coordinates,
        },
        pricing: vendorData.pricing,
        plan: 'trial',
        trialEndsAt,
        slaMinutes: 3,
        status: VENDOR_STATUS.ACTIVE,
        isOpen: true,
        averageRating: 4 + Math.random(),
        totalRatings: Math.floor(Math.random() * 50) + 10,
        totalOrders: Math.floor(Math.random() * 100) + 20,
        completedOrders: Math.floor(Math.random() * 90) + 15,
      });

      logger.info(`Created vendor: ${vendorData.email}`);
    }

    logger.info('Demo data seeding completed!');
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    logger.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedDemoData();
