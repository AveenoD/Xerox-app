import mongoose from 'mongoose';
import User from '../models/user.model.js';
import VendorProfile from '../models/vendorProfile.model.js';
import Subscription from '../models/subscription.model.js';
import {
  SLA_CONFIG,
  TRIAL_DAYS,
  USER_ROLES,
  VENDOR_STATUS,
} from '../config/constants.js';
import ApiError from '../utils/ApiError.js';
import { logger } from '../utils/logger.js';

export const vendorService = {
  // Register as vendor
  async registerVendor(
    userId: string,
    shopName: string,
    shopAddress: string,
    coordinates: [number, number],
    pricing: {
      A4: { bw_single: number; bw_double: number; color_single: number; color_double: number };
      A3: { bw_single: number; bw_double: number; color_single: number; color_double: number };
      Legal: { bw_single: number; bw_double: number; color_single: number; color_double: number };
    },
    shopPhoto?: string
  ) {
    // Check if user already has a vendor profile
    const existingVendor = await VendorProfile.findOne({ userId });
    if (existingVendor) {
      throw ApiError.conflict('You already have a vendor account');
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    // Create vendor profile
    const trialEndsAt = new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000);

    const vendorProfile = await VendorProfile.create({
      userId,
      shopName,
      shopAddress,
      shopPhoto,
      location: {
        type: 'Point',
        coordinates,
      },
      pricing,
      plan: 'trial',
      trialEndsAt,
      slaMinutes: SLA_CONFIG.TRIAL,
      status: VENDOR_STATUS.ACTIVE,
    });

    // Update user role
    user.role = USER_ROLES.VENDOR;
    await user.save();

    // Create subscription record (trial)
    await Subscription.create({
      vendorId: vendorProfile._id,
      plan: 'trial',
      status: 'trial',
      startDate: new Date(),
      endDate: trialEndsAt,
      monthlyAmount: 0,
    });

    logger.info(`Vendor registered: ${shopName} for user ${userId}`);

    return vendorProfile;
  },

  // Get vendor by user ID
  async getVendorByUserId(userId: string) {
    return VendorProfile.findOne({ userId }).populate('userId', 'fullName email phone');
  },

  // Get vendor by ID
  async getVendorById(vendorId: string) {
    return VendorProfile.findById(vendorId).populate('userId', 'fullName email phone avatar');
  },

  // Update vendor profile
  async updateVendor(
    vendorId: string,
    updates: {
      shopName?: string;
      shopAddress?: string;
      shopPhoto?: string;
      pricing?: {
        A4?: { bw_single?: number; bw_double?: number; color_single?: number; color_double?: number };
        A3?: { bw_single?: number; bw_double?: number; color_single?: number; color_double?: number };
        Legal?: { bw_single?: number; bw_double?: number; color_single?: number; color_double?: number };
      };
      isOpen?: boolean;
    }
  ) {
    const vendor = await VendorProfile.findById(vendorId);
    if (!vendor) {
      throw ApiError.notFound('Vendor not found');
    }

    // Apply updates
    if (updates.shopName) vendor.shopName = updates.shopName;
    if (updates.shopAddress) vendor.shopAddress = updates.shopAddress;
    if (updates.shopPhoto) vendor.shopPhoto = updates.shopPhoto;
    if (updates.isOpen !== undefined) vendor.isOpen = updates.isOpen;

    if (updates.pricing) {
      if (updates.pricing.A4) {
        vendor.pricing.A4 = { ...vendor.pricing.A4, ...updates.pricing.A4 };
      }
      if (updates.pricing.A3) {
        vendor.pricing.A3 = { ...vendor.pricing.A3, ...updates.pricing.A3 };
      }
      if (updates.pricing.Legal) {
        vendor.pricing.Legal = { ...vendor.pricing.Legal, ...updates.pricing.Legal };
      }
    }

    await vendor.save();
    return vendor;
  },

  // Toggle shop open/close
  async toggleShopStatus(vendorId: string) {
    const vendor = await VendorProfile.findById(vendorId);
    if (!vendor) {
      throw ApiError.notFound('Vendor not found');
    }

    // Check if suspended
    if (vendor.status === VENDOR_STATUS.SUSPENDED && vendor.suspendedUntil) {
      if (vendor.suspendedUntil > new Date()) {
        throw ApiError.forbidden(`Shop is suspended until ${vendor.suspendedUntil.toLocaleString()}`);
      }
    }

    vendor.isOpen = !vendor.isOpen;
    await vendor.save();

    logger.info(`Vendor ${vendorId} shop status: ${vendor.isOpen ? 'OPEN' : 'CLOSED'}`);

    return vendor;
  },

  // Search nearby vendors
  async searchNearbyVendors(
    longitude: number,
    latitude: number,
    maxDistanceMeters: number = 5000,
    options?: {
      page?: number;
      limit?: number;
      minRating?: number;
    }
  ) {
    const page = options?.page || 1;
    const limit = options?.limit || 10;
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = {
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [longitude, latitude],
          },
          $maxDistance: maxDistanceMeters,
        },
      },
      isOpen: true,
      status: VENDOR_STATUS.ACTIVE,
    };

    // Add rating filter if specified
    if (options?.minRating) {
      query.averageRating = { $gte: options.minRating };
    }

    const [vendors, total] = await Promise.all([
      VendorProfile.find(query).populate('userId', 'fullName phone').skip(skip).limit(limit),
      VendorProfile.countDocuments(query),
    ]);

    return {
      vendors,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  },

  // Get vendor analytics
  async getVendorAnalytics(vendorId: string) {
    const vendor = await VendorProfile.findById(vendorId);
    if (!vendor) {
      throw ApiError.notFound('Vendor not found');
    }

    // For now, return basic stats from vendor profile
    // Full analytics will be enhanced with Order aggregation
    return {
      todayOrders: vendor.totalOrders,
      todayRevenue: 0,
      weekOrders: vendor.totalOrders,
      weekRevenue: 0,
      averageRating: vendor.averageRating,
      totalOrders: vendor.totalOrders,
      completedOrders: vendor.completedOrders,
      pendingOrders: 0,
    };
  },

  // Add strike to vendor
  async addStrike(
    vendorId: string,
    reason: string,
    orderId?: string,
    addedBy: 'system' | 'admin' = 'system'
  ) {
    const vendor = await VendorProfile.findById(vendorId);
    if (!vendor) {
      throw ApiError.notFound('Vendor not found');
    }

    await vendor.addStrike(
      reason,
      orderId ? new mongoose.Types.ObjectId(orderId) : undefined,
      addedBy
    );

    logger.info(`Strike added to vendor ${vendorId}: ${reason}`);

    return vendor;
  },

  // Remove strike
  async removeStrike(
    vendorId: string,
    adminId: string
  ) {
    const vendor = await VendorProfile.findById(vendorId);
    if (!vendor) {
      throw ApiError.notFound('Vendor not found');
    }

    if (vendor.strikes > 0) {
      vendor.strikeHistory.pop();
      vendor.strikes = vendor.strikeHistory.length;
      await vendor.save();
    }

    logger.info(`Strike removed from vendor ${vendorId} by admin ${adminId}`);

    return vendor;
  },

  // Suspend vendor
  async suspendVendor(
    vendorId: string,
    hours: number,
    reason: string
  ) {
    const vendor = await VendorProfile.findById(vendorId);
    if (!vendor) {
      throw ApiError.notFound('Vendor not found');
    }

    vendor.status = VENDOR_STATUS.SUSPENDED;
    vendor.isOpen = false;
    vendor.suspendedUntil = new Date(Date.now() + hours * 60 * 60 * 1000);
    vendor.suspendReason = reason;
    await vendor.save();

    logger.info(`Vendor ${vendorId} suspended for ${hours} hours: ${reason}`);

    return vendor;
  },

  // Calculate print cost
  async calculatePrintCost(
    vendorId: string,
    paperSize: string,
    printType: string,
    pageCount: number,
    copies: number = 1
  ) {
    const vendor = await VendorProfile.findById(vendorId);
    if (!vendor) {
      throw ApiError.notFound('Vendor not found');
    }

    const pricing = vendor.pricing[paperSize as keyof typeof vendor.pricing];
    if (!pricing) {
      throw ApiError.badRequest(`Invalid paper size: ${paperSize}`);
    }

    const pricePerPage = pricing[printType as keyof typeof pricing];
    if (pricePerPage === undefined) {
      throw ApiError.badRequest(`Invalid print type: ${printType}`);
    }

    return pricePerPage * pageCount * copies;
  },
};

export default vendorService;
