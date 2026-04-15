import jwt from 'jsonwebtoken';
import { Resend } from 'resend';
import mongoose from 'mongoose';
import User, { IUser } from '../models/user.model.js';
import Wallet, { IWallet } from '../models/wallet.model.js';
import Challenge, { IChallenge } from '../models/challenge.model.js';
import Referral from '../models/referral.model.js';
import {
  JWT_CONFIG,
  USER_ROLES,
  WALLET_CONFIG,
  REFERRAL_CODE_LENGTH,
} from '../config/constants.js';
import ApiError from '../utils/ApiError.js';
import { logger } from '../utils/logger.js';

// Initialize Resend (email service)
const resend = new Resend(process.env.RESEND_API_KEY);

// Generate OTP
const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Generate referral code
const generateReferralCode = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'XC';
  for (let i = 0; i < REFERRAL_CODE_LENGTH; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// Store OTPs temporarily (in production, use Redis)
const otpStore = new Map<string, { otp: string; expires: Date }>();

export const authService = {
  // Send OTP to email
  async sendEmailOTP(email: string): Promise<{ success: boolean; message: string }> {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (user && user.isEmailVerified) {
      throw ApiError.conflict('Email already registered and verified');
    }

    const otp = generateOTP();
    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store OTP
    otpStore.set(email.toLowerCase(), { otp, expires });

    // Send email
    try {
      if (process.env.RESEND_API_KEY) {
        await resend.emails.send({
          from: 'XConnect <noreply@xconnect.app>',
          to: email,
          subject: 'Your XConnect OTP Code',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 400px; margin: 0 auto;">
              <h2 style="color: #333;">Verify your email</h2>
              <p>Your OTP code is:</p>
              <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #4F46E5; padding: 20px; background: #f3f4f6; text-align: center; border-radius: 8px;">
                ${otp}
              </div>
              <p style="color: #666; font-size: 14px;">This code expires in 10 minutes.</p>
            </div>
          `,
        });
      } else {
        // Development mode - just log
        logger.info(`[DEV] OTP for ${email}: ${otp}`);
      }

      logger.info(`OTP sent to ${email}`);
      return { success: true, message: 'OTP sent to email' };
    } catch (error) {
      logger.error('Failed to send OTP:', error);
      throw ApiError.internal('Failed to send OTP');
    }
  },

  // Verify OTP
  async verifyEmailOTP(
    email: string,
    otp: string
  ): Promise<{ success: boolean; message: string }> {
    const stored = otpStore.get(email.toLowerCase());

    if (!stored) {
      throw ApiError.badRequest('OTP not found or expired. Please request a new OTP.');
    }

    if (new Date() > stored.expires) {
      otpStore.delete(email.toLowerCase());
      throw ApiError.badRequest('OTP expired. Please request a new OTP.');
    }

    if (stored.otp !== otp) {
      throw ApiError.badRequest('Invalid OTP');
    }

    // Clear OTP
    otpStore.delete(email.toLowerCase());

    return { success: true, message: 'OTP verified successfully' };
  },

  // Register user
  async register(
    email: string,
    password: string,
    fullName: string,
    phone: string,
    referralCode?: string
  ): Promise<{
    user: Record<string, unknown>;
    accessToken: string;
    refreshToken: string;
  }> {
    // Check if user exists
    let existingUser = await User.findOne({ email: email.toLowerCase() });
    let isNewUser = false;

    if (existingUser) {
      if (existingUser.isEmailVerified) {
        throw ApiError.conflict('Email already registered');
      }
      // Update existing unverified user
      existingUser.password = password;
      existingUser.fullName = fullName;
      existingUser.phone = phone;
      existingUser.isEmailVerified = true;
      existingUser.emailVerifiedAt = new Date();
      await existingUser.save();
    } else {
      // Create new user
      isNewUser = true;
      const newReferralCode = generateReferralCode();

      const user = new User({
        email: email.toLowerCase(),
        password,
        fullName,
        phone,
        role: USER_ROLES.USER,
        isEmailVerified: true,
        emailVerifiedAt: new Date(),
        referralCode: newReferralCode,
      });

      await user.save();
      existingUser = user;

      // Create wallet for user
      await Wallet.create({
        userId: user._id,
        balance: WALLET_CONFIG.SIGNUP_BONUS,
        transactions: [
          {
            type: 'credit',
            amount: WALLET_CONFIG.SIGNUP_BONUS,
            source: 'signup_bonus',
            description: 'Welcome bonus',
            expiresAt: new Date(
              Date.now() + WALLET_CONFIG.SIGNUP_BONUS_EXPIRY_DAYS * 24 * 60 * 60 * 1000
            ),
            balanceAfter: WALLET_CONFIG.SIGNUP_BONUS,
          },
        ],
      });

      // Create challenges for user
      await Challenge.createForUser(user._id as mongoose.Types.ObjectId, new Date());

      // Handle referral
      if (referralCode) {
        const referrer = await User.findOne({ referralCode });
        if (referrer) {
          // Create referral record
          await Referral.create({
            referrerId: referrer._id,
            refereeId: user._id,
            referralCode,
            refereeSignupBonus: {
              amount: WALLET_CONFIG.REFERRAL_SIGNUP_BONUS,
              creditedAt: new Date(),
              expiresAt: new Date(
                Date.now() + WALLET_CONFIG.SIGNUP_BONUS_EXPIRY_DAYS * 24 * 60 * 60 * 1000
              ),
            },
          });

          // Credit referrer's wallet
          const referrerWallet = await Wallet.findOne({ userId: referrer._id });
          if (referrerWallet) {
            await referrerWallet.credit(
              WALLET_CONFIG.REFERRAL_SIGNUP_BONUS,
              'referral',
              `Referral bonus for inviting ${fullName}`
            );
          }

          // Update referrer's referredBy count
          user.referredBy = referrer._id;
          await user.save();
        }
      }
    }

    // Generate tokens
    const accessToken = this.generateAccessToken(existingUser._id.toString(), email, USER_ROLES.USER);
    const refreshToken = this.generateRefreshToken(existingUser._id.toString());

    // Update last login
    await User.findByIdAndUpdate(existingUser._id, { lastLoginAt: new Date() });

    return {
      user: {
        _id: existingUser._id,
        fullName: existingUser.fullName,
        email: existingUser.email,
        phone: existingUser.phone,
        role: existingUser.role,
        referralCode: existingUser.referralCode,
      },
      accessToken,
      refreshToken,
    };
  },

  // Login
  async login(
    email: string,
    password: string
  ): Promise<{
    user: Record<string, unknown>;
    accessToken: string;
    refreshToken: string;
  }> {
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    if (!user.isEmailVerified) {
      throw ApiError.unauthorized('Please verify your email first');
    }

    if (!user.isActive) {
      throw ApiError.unauthorized('Account is deactivated');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    const accessToken = this.generateAccessToken(user._id.toString(), user.email, user.role);
    const refreshToken = this.generateRefreshToken(user._id.toString());

    // Update last login
    user.lastLoginAt = new Date();
    await user.save();

    return {
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        referralCode: user.referralCode,
      },
      accessToken,
      refreshToken,
    };
  },

  // Generate access token
  generateAccessToken(userId: string, email: string, role: string): string {
    return jwt.sign({ _id: userId, email, role }, JWT_CONFIG.ACCESS_TOKEN_SECRET, {
      expiresIn: JWT_CONFIG.ACCESS_TOKEN_EXPIRY,
    });
  },

  // Generate refresh token
  generateRefreshToken(userId: string): string {
    return jwt.sign({ _id: userId }, JWT_CONFIG.REFRESH_TOKEN_SECRET, {
      expiresIn: JWT_CONFIG.REFRESH_TOKEN_EXPIRY,
    });
  },

  // Refresh access token
  async refreshAccessToken(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    try {
      const decoded = jwt.verify(refreshToken, JWT_CONFIG.REFRESH_TOKEN_SECRET) as {
        _id: string;
      };

      const user = await User.findById(decoded._id);
      if (!user || !user.isActive) {
        throw ApiError.unauthorized('Invalid refresh token');
      }

      const newAccessToken = this.generateAccessToken(
        user._id.toString(),
        user.email,
        user.role
      );
      const newRefreshToken = this.generateRefreshToken(user._id.toString());

      return { accessToken: newAccessToken, refreshToken: newRefreshToken };
    } catch {
      throw ApiError.unauthorized('Invalid refresh token');
    }
  },

  // Resend OTP
  async resendOTP(email: string): Promise<{ success: boolean; message: string }> {
    return this.sendEmailOTP(email);
  },
};

export default authService;
