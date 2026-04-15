import mongoose, { Types } from 'mongoose';
import Order, { IOrder } from '../models/order.model.js';
import User from '../models/user.model.js';
import VendorProfile from '../models/vendorProfile.model.js';
import Wallet from '../models/wallet.model.js';
import Challenge from '../models/challenge.model.js';
import Referral from '../models/referral.model.js';
import {
  ORDER_STATUS,
  PAYMENT_STATUS,
  PAYMENT_METHOD,
  WALLET_CONFIG,
  FILE_CONFIG,
} from '../config/constants.js';
import ApiError from '../utils/ApiError.js';
import { logger } from '../utils/logger.js';
import { calculatePlatformFee } from '../config/constants.js';

// Generate pickup token (unique per vendor per day)
const generatePickupToken = (): string => {
  const chars = '0123456789';
  let token = '';
  for (let i = 0; i < 4; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `ORD-${token}`;
};

// Generate order ID
const generateOrderId = (): string => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORD-${timestamp}${random}`;
};

export const orderService = {
  // Create new order
  async createOrder(
    customerId: string,
    vendorId: string,
    fileName: string,
    fileUrl: string,
    previewUrl: string,
    pageCount: number,
    originalFileSize: number,
    printConfig: {
      paperSize: 'A4' | 'A3' | 'Legal';
      printType: 'bw_single' | 'bw_double' | 'color_single' | 'color_double';
      copies: number;
    },
    customerNotes?: string
  ): Promise<IOrder> {
    // Validate customer
    const customer = await User.findById(customerId);
    if (!customer) {
      throw ApiError.notFound('Customer not found');
    }

    // Validate vendor
    const vendor = await VendorProfile.findById(vendorId);
    if (!vendor) {
      throw ApiError.notFound('Vendor not found');
    }

    // Check if vendor can receive orders
    if (!vendor.canReceiveOrders()) {
      throw ApiError.badRequest('Vendor is not accepting orders');
    }

    // Calculate print cost
    const pricing = vendor.pricing[printConfig.paperSize as keyof typeof vendor.pricing];
    const pricePerPage = pricing[printConfig.printType as keyof typeof pricing];
    const printCost = pricePerPage * pageCount * printConfig.copies;

    // Calculate platform fee
    const platformFee = calculatePlatformFee(pageCount);

    // Calculate total
    const totalAmount = printCost + platformFee;

    // SLA deadline based on vendor's plan
    const slaMinutes = vendor.getSlaMinutes();
    const slaDeadline = new Date(Date.now() + slaMinutes * 60 * 1000);

    // Generate tokens
    const orderId = generateOrderId();
    const pickupToken = generatePickupToken();

    // File delete time
    const fileDeleteAt = new Date(Date.now() + FILE_CONFIG.FILE_EXPIRY_HOURS * 60 * 60 * 1000);

    // Create order
    const order = new Order({
      orderId,
      customerId: new Types.ObjectId(customerId),
      vendorId: new Types.ObjectId(vendorId),
      fileName,
      fileUrl,
      previewUrl,
      pageCount,
      originalFileSize,
      printConfig,
      printCost,
      platformFee,
      totalAmount,
      status: ORDER_STATUS.PENDING,
      statusHistory: [
        {
          status: ORDER_STATUS.PENDING,
          timestamp: new Date(),
          note: 'Order created',
        },
      ],
      slaDeadline,
      slaBreached: false,
      pickupToken,
      paymentStatus: PAYMENT_STATUS.PENDING,
      paymentMethod: PAYMENT_METHOD.WALLET,
      customerNotes,
      fileDeleteAt,
      keepForFuture: false,
      countedForChallenge: {
        firstOrder: false,
        consistentUser: false,
      },
    });

    // Update vendor order count
    vendor.totalOrders += 1;
    await vendor.save();

    await order.save();

    logger.info(`Order created: ${orderId} for customer ${customerId} from vendor ${vendorId}`);

    return order;
  },

  // Accept order (vendor)
  async acceptOrder(orderId: string, vendorId: string): Promise<IOrder> {
    const order = await Order.findById(orderId);
    if (!order) {
      throw ApiError.notFound('Order not found');
    }

    if (order.vendorId.toString() !== vendorId) {
      throw ApiError.forbidden('This order does not belong to you');
    }

    if (order.status !== ORDER_STATUS.PENDING) {
      throw ApiError.badRequest('Order is not in pending status');
    }

    if (order.slaDeadline < new Date()) {
      throw ApiError.badRequest('SLA deadline has passed');
    }

    // Accept order
    order.status = ORDER_STATUS.ACCEPTED;
    order.slaAcceptedAt = new Date();
    order.paymentStatus = PAYMENT_STATUS.PAID; // Deduct from wallet on accept
    order.statusHistory.push({
      status: ORDER_STATUS.ACCEPTED,
      timestamp: new Date(),
      note: 'Order accepted by vendor',
    });

    // Deduct from customer wallet
    const wallet = await Wallet.findOne({ userId: order.customerId });
    if (wallet) {
      const totalBalance = wallet.balance + wallet.promoBalance;
      if (totalBalance >= order.totalAmount) {
        await wallet.debit(
          order.totalAmount,
          'order_payment',
          `Payment for order ${order.orderId}`,
          { relatedOrderId: order._id as Types.ObjectId }
        );
      } else {
        throw ApiError.badRequest('Insufficient wallet balance');
      }
    }

    await order.save();

    logger.info(`Order accepted: ${order.orderId} by vendor ${vendorId}`);

    return order;
  },

  // Reject order (vendor)
  async rejectOrder(
    orderId: string,
    vendorId: string,
    reason: string
  ): Promise<IOrder> {
    const order = await Order.findById(orderId);
    if (!order) {
      throw ApiError.notFound('Order not found');
    }

    if (order.vendorId.toString() !== vendorId) {
      throw ApiError.forbidden('This order does not belong to you');
    }

    if (order.status !== ORDER_STATUS.PENDING) {
      throw ApiError.badRequest('Order is not in pending status');
    }

    order.status = ORDER_STATUS.REJECTED;
    order.statusHistory.push({
      status: ORDER_STATUS.REJECTED,
      timestamp: new Date(),
      note: reason || 'Order rejected by vendor',
    });

    await order.save();

    logger.info(`Order rejected: ${order.orderId} by vendor ${vendorId}: ${reason}`);

    return order;
  },

  // Mark as printing
  async markPrinting(orderId: string, vendorId: string): Promise<IOrder> {
    const order = await Order.findById(orderId);
    if (!order) {
      throw ApiError.notFound('Order not found');
    }

    if (order.vendorId.toString() !== vendorId) {
      throw ApiError.forbidden('This order does not belong to you');
    }

    if (order.status !== ORDER_STATUS.ACCEPTED) {
      throw ApiError.badRequest('Order must be accepted before printing');
    }

    order.status = ORDER_STATUS.PRINTING;
    order.statusHistory.push({
      status: ORDER_STATUS.PRINTING,
      timestamp: new Date(),
      note: 'Printing started',
    });

    // Estimate ready time (5 minutes per 10 pages + base 10 minutes)
    const estimatedMinutes = Math.ceil(order.pageCount / 10) * 5 + 10;
    order.estimatedReadyTime = new Date(Date.now() + estimatedMinutes * 60 * 1000);

    await order.save();

    logger.info(`Order printing: ${order.orderId}`);

    return order;
  },

  // Mark as ready
  async markReady(orderId: string, vendorId: string): Promise<IOrder> {
    const order = await Order.findById(orderId);
    if (!order) {
      throw ApiError.notFound('Order not found');
    }

    if (order.vendorId.toString() !== vendorId) {
      throw ApiError.forbidden('This order does not belong to you');
    }

    if (order.status !== ORDER_STATUS.PRINTING) {
      throw ApiError.badRequest('Order must be printing before marking ready');
    }

    order.status = ORDER_STATUS.READY;
    order.actualReadyTime = new Date();
    order.statusHistory.push({
      status: ORDER_STATUS.READY,
      timestamp: new Date(),
      note: 'Ready for pickup',
    });

    await order.save();

    logger.info(`Order ready: ${order.orderId}`);

    return order;
  },

  // Complete order (customer picks up)
  async completeOrder(orderId: string, customerId: string): Promise<IOrder> {
    const order = await Order.findById(orderId);
    if (!order) {
      throw ApiError.notFound('Order not found');
    }

    if (order.customerId.toString() !== customerId) {
      throw ApiError.forbidden('This order does not belong to you');
    }

    if (order.status !== ORDER_STATUS.READY) {
      throw ApiError.badRequest('Order must be ready for pickup');
    }

    order.status = ORDER_STATUS.COMPLETED;
    order.statusHistory.push({
      status: ORDER_STATUS.COMPLETED,
      timestamp: new Date(),
      note: 'Order completed - picked up',
    });

    // Update vendor completed orders
    await VendorProfile.findByIdAndUpdate(order.vendorId, {
      $inc: { completedOrders: 1 },
    });

    // Update challenge tracking
    order.countedForChallenge.firstOrder = true;
    await order.save();

    // Check for challenges
    await this.processChallenges(customerId, order);

    // Process referral bonus
    await this.processReferralBonus(customerId, order);

    logger.info(`Order completed: ${order.orderId}`);

    return order;
  },

  // Cancel order (customer)
  async cancelOrder(orderId: string, customerId: string): Promise<IOrder> {
    const order = await Order.findById(orderId);
    if (!order) {
      throw ApiError.notFound('Order not found');
    }

    if (order.customerId.toString() !== customerId) {
      throw ApiError.forbidden('This order does not belong to you');
    }

    if (order.status !== ORDER_STATUS.PENDING) {
      throw ApiError.badRequest('Only pending orders can be cancelled');
    }

    order.status = ORDER_STATUS.CANCELLED;
    order.statusHistory.push({
      status: ORDER_STATUS.CANCELLED,
      timestamp: new Date(),
      note: 'Cancelled by customer',
    });

    // Refund wallet if payment was made
    if (order.paymentStatus === PAYMENT_STATUS.PAID) {
      const wallet = await Wallet.findOne({ userId: customerId });
      if (wallet) {
        await wallet.credit(
          order.totalAmount,
          'order_refund',
          `Refund for cancelled order ${order.orderId}`,
          { relatedOrderId: order._id as Types.ObjectId }
        );
        order.paymentStatus = PAYMENT_STATUS.REFUNDED;
      }
    }

    await order.save();

    logger.info(`Order cancelled: ${order.orderId}`);

    return order;
  },

  // Get order by ID
  async getOrderById(orderId: string): Promise<IOrder | null> {
    return Order.findById(orderId)
      .populate('customerId', 'fullName email phone')
      .populate('vendorId', 'shopName shopAddress pricing');
  },

  // Get customer's orders
  async getCustomerOrders(
    customerId: string,
    options?: {
      status?: string;
      page?: number;
      limit?: number;
    }
  ): Promise<{
    orders: IOrder[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const page = options?.page || 1;
    const limit = options?.limit || 10;
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = { customerId: new Types.ObjectId(customerId) };
    if (options?.status) {
      query.status = options.status;
    }

    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate('vendorId', 'shopName shopAddress')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Order.countDocuments(query),
    ]);

    return {
      orders,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  },

  // Get vendor's orders
  async getVendorOrders(
    vendorId: string,
    options?: {
      status?: string;
      page?: number;
      limit?: number;
    }
  ): Promise<{
    orders: IOrder[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const page = options?.page || 1;
    const limit = options?.limit || 10;
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = { vendorId: new Types.ObjectId(vendorId) };
    if (options?.status) {
      query.status = options.status;
    }

    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate('customerId', 'fullName phone')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Order.countDocuments(query),
    ]);

    return {
      orders,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  },

  // Process SLA timeout
  async processSlaTimeout(orderId: string): Promise<{ order: IOrder; vendor: typeof VendorProfile.prototype }> {
    const order = await Order.findById(orderId);
    if (!order) {
      throw ApiError.notFound('Order not found');
    }

    if (order.status !== ORDER_STATUS.PENDING) {
      const vendor = await VendorProfile.findById(order.vendorId);
      return { order, vendor: vendor! };
    }

    // Cancel order
    order.status = ORDER_STATUS.CANCELLED;
    order.slaBreached = true;
    order.statusHistory.push({
      status: ORDER_STATUS.CANCELLED,
      timestamp: new Date(),
      note: 'Auto-cancelled: SLA timeout',
    });

    // Refund if paid
    if (order.paymentStatus === PAYMENT_STATUS.PAID) {
      const wallet = await Wallet.findOne({ userId: order.customerId });
      if (wallet) {
        await wallet.credit(
          order.totalAmount,
          'order_refund',
          `Refund for SLA timeout - order ${order.orderId}`,
          { relatedOrderId: order._id as Types.ObjectId }
        );
        order.paymentStatus = PAYMENT_STATUS.REFUNDED;
      }
    }

    await order.save();

    // Add strike to vendor
    const vendor = await VendorProfile.findById(order.vendorId);
    if (vendor) {
      await vendor.addStrike(
        'SLA timeout - order not accepted in time',
        order._id as Types.ObjectId,
        'system'
      );
    }

    logger.info(`Order SLA timeout: ${order.orderId}`);

    return { order, vendor: vendor! };
  },

  // Process challenges after order completion
  async processChallenges(customerId: string, order: IOrder): Promise<void> {
    const userId = new Types.ObjectId(customerId);

    // First order challenge
    const firstPrintChallenge = await Challenge.findOne({
      userId,
      challengeType: 'first_print',
      status: 'active',
    });

    if (firstPrintChallenge && !order.countedForChallenge.firstOrder) {
      await firstPrintChallenge.updateProgress(1);
      if (firstPrintChallenge.status === 'completed' && !firstPrintChallenge.rewardCredited) {
        // Credit wallet
        const wallet = await Wallet.findOne({ userId });
        if (wallet) {
          await wallet.credit(
            firstPrintChallenge.rewardAmount,
            'challenge',
            'First Print Challenge completed!',
            {
              expiresAt: new Date(Date.now() + WALLET_CONFIG.PROMO_BALANCE_EXPIRY_DAYS * 24 * 60 * 60 * 1000),
              isPromo: true,
            }
          );
          firstPrintChallenge.rewardCredited = true;
          await firstPrintChallenge.save();
        }
      }
    }

    // Consistent user challenge
    const consistentChallenge = await Challenge.findOne({
      userId,
      challengeType: 'consistent_user',
      status: 'active',
    });

    if (consistentChallenge) {
      await consistentChallenge.updateProgress(1);
      if (consistentChallenge.status === 'completed' && !consistentChallenge.rewardCredited) {
        const wallet = await Wallet.findOne({ userId });
        if (wallet) {
          await wallet.credit(
            consistentChallenge.rewardAmount,
            'challenge',
            'Consistent User Challenge completed!',
            {
              expiresAt: new Date(Date.now() + WALLET_CONFIG.PROMO_BALANCE_EXPIRY_DAYS * 24 * 60 * 60 * 1000),
              isPromo: true,
            }
          );
          consistentChallenge.rewardCredited = true;
          await consistentChallenge.save();
        }
      }
    }
  },

  // Process referral bonus
  async processReferralBonus(customerId: string, order: IOrder): Promise<void> {
    const user = await User.findById(customerId);
    if (!user?.referredBy) return;

    const referral = await Referral.findOne({
      refereeId: new Types.ObjectId(customerId),
      status: 'pending_first_order',
    });

    if (!referral) return;

    // Check how many referrals referrer has
    const referralCount = await Referral.countDocuments({
      referrerId: user.referredBy,
      status: { $in: ['pending_first_order', 'completed'] },
    });

    // Determine bonus amount
    const bonusAmount =
      referralCount <= WALLET_CONFIG.REFERRAL_TIER1_COUNT
        ? WALLET_CONFIG.REFERRAL_FIRST_ORDER_TIER1
        : WALLET_CONFIG.REFERRAL_FIRST_ORDER_TIER2;

    // Credit referrer
    const referrerWallet = await Wallet.findOne({ userId: user.referredBy });
    if (referrerWallet) {
      await referrerWallet.credit(
        bonusAmount,
        'referral',
        `Referral bonus for ${user.fullName}'s first order`
      );
    }

    // Update referral status
    referral.referrerFirstOrderBonus = {
      amount: bonusAmount,
      creditedAt: new Date(),
      orderId: order._id as Types.ObjectId,
    };
    referral.status = 'completed';
    await referral.save();
  },

  // Keep file for future
  async toggleKeepForFuture(orderId: string, customerId: string, keep: boolean): Promise<IOrder> {
    const order = await Order.findById(orderId);
    if (!order) {
      throw ApiError.notFound('Order not found');
    }

    if (order.customerId.toString() !== customerId) {
      throw ApiError.forbidden('This order does not belong to you');
    }

    if (order.status !== ORDER_STATUS.COMPLETED && order.status !== ORDER_STATUS.READY) {
      throw ApiError.badRequest('Can only toggle for completed or ready orders');
    }

    order.keepForFuture = keep;
    if (keep) {
      // Extend to 7 days
      order.fileDeleteAt = new Date(Date.now() + FILE_CONFIG.FILE_KEEP_HOURS * 60 * 60 * 1000);
    }

    await order.save();
    return order;
  },
};

export default orderService;
