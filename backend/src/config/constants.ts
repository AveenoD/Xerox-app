// XConnect - All Magic Numbers & Constants

// ==================== SERVER ====================
export const SERVER_CONFIG = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  BASE_URL: process.env.BASE_URL || 'http://localhost:5000',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
} as const;

// ==================== JWT ====================
export const JWT_CONFIG = {
  ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET || 'access-secret-change-in-production',
  REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET || 'refresh-secret-change-in-production',
  ACCESS_TOKEN_EXPIRY: '15m',
  REFRESH_TOKEN_EXPIRY: '7d',
} as const;

// ==================== PLATFORM FEES (Page-wise) ====================
export const PLATFORM_FEES = {
  TIER_1: { maxPages: 10, fee: 2 },      // ₹2 for 1-10 pages
  TIER_2: { maxPages: 20, fee: 3 },      // ₹3 for 11-20 pages
  TIER_3: { maxPages: 50, fee: 5 },      // ₹5 for 21-50 pages
  TIER_4: { maxPages: Infinity, fee: 8 } // ₹8 for 51+ pages
} as const;

export const calculatePlatformFee = (pageCount: number): number => {
  if (pageCount <= PLATFORM_FEES.TIER_1.maxPages) return PLATFORM_FEES.TIER_1.fee;
  if (pageCount <= PLATFORM_FEES.TIER_2.maxPages) return PLATFORM_FEES.TIER_2.fee;
  if (pageCount <= PLATFORM_FEES.TIER_3.maxPages) return PLATFORM_FEES.TIER_3.fee;
  return PLATFORM_FEES.TIER_4.fee;
};

// ==================== SLA TIMER (in minutes) ====================
export const SLA_CONFIG = {
  STARTER: 2,      // 2 minutes for Starter plan
  GROWTH: 3,       // 3 minutes for Growth plan
  PREMIUM: 3,      // 3 minutes for Premium plan
  TRIAL: 3,        // 3 minutes for trial period
  DEFAULT: 3       // Default SLA
} as const;

// ==================== SUBSCRIPTION PLANS ====================
export const SUBSCRIPTION_PLANS = {
  starter: {
    name: 'Starter',
    price: 149,
    slaMinutes: SLA_CONFIG.STARTER,
    searchRadiusMeters: 250,
    dailyOrderLimit: 15,
    maxFileSizeMB: 10,
    priority: 0,
    verifiedBadge: false,
    analyticsDepth: 'basic',
    bulkQueue: false,
    multiLocation: false,
    priorityDisputes: false
  },
  growth: {
    name: 'Growth',
    price: 299,
    slaMinutes: SLA_CONFIG.GROWTH,
    searchRadiusMeters: 1000,
    dailyOrderLimit: Infinity,
    maxFileSizeMB: 25,
    priority: 1,
    verifiedBadge: true,
    analyticsDepth: 'advanced',
    bulkQueue: true,
    multiLocation: false,
    priorityDisputes: false
  },
  premium: {
    name: 'Premium',
    price: 499,
    slaMinutes: SLA_CONFIG.PREMIUM,
    searchRadiusMeters: 3000,
    dailyOrderLimit: Infinity,
    maxFileSizeMB: 100,
    priority: 2,
    verifiedBadge: true,
    analyticsDepth: 'full',
    bulkQueue: true,
    multiLocation: true,
    priorityDisputes: true
  }
} as const;

export const TRIAL_DAYS = 30;
export const TRIAL_MINUTES = TRIAL_DAYS * 24 * 60;

// ==================== STRIKE SYSTEM ====================
export const STRIKE_THRESHOLDS = {
  starter: {
    warning: 3,
    suspend24h: 5,
    permanentReview: 7
  },
  growth: {
    warning: 3,
    suspend24h: 7,
    permanentReview: 10
  },
  premium: {
    warning: 3,
    suspend72h: 10,
    permanentReview: 15
  },
  trial: {
    warning: 3,
    suspend24h: 5,
    permanentReview: 7
  }
} as const;

export const STRIKE_DECAY_DAYS = 30;

// ==================== WALLET & BONUSES ====================
export const WALLET_CONFIG = {
  SIGNUP_BONUS: 10,
  SIGNUP_BONUS_EXPIRY_DAYS: 7,

  // Referral rewards
  REFERRAL_SIGNUP_BONUS: 10,       // Referee gets on signup
  REFERRAL_FIRST_ORDER_TIER1: 10, // Referrer gets (first 3 referrals)
  REFERRAL_FIRST_ORDER_TIER2: 5,  // Referrer gets (4th onwards)
  REFERRAL_TIER1_COUNT: 3,         // First 3 referrals get ₹10

  // Challenge rewards
  CHALLENGE_FIRST_PRINT: 10,
  CHALLENGE_EARLY_BIRD: 5,
  CHALLENGE_CONSISTENT_USER: 5,

  // Challenge settings
  EARLY_BIRD_HOURS: 24,           // Must complete order within 24hr
  CONSISTENT_USER_ORDER_COUNT: 3, // 3 orders
  CONSISTENT_USER_DAYS: 30,       // Within 30 days

  // Promo balance
  PROMO_BALANCE_EXPIRY_DAYS: 7
} as const;

// ==================== SPIN & WIN ====================
export const SPIN_CONFIG = {
  COST_PER_SPIN: 1,               // ₹1 per spin
  MAX_SPINS_PER_DAY: 10,
  DAILY_REWARD_BUDGET_CAP: 50,     // ₹50 max daily rewards
  COMMISSION_FREE_VALID_HOURS: 24,
  MAX_COMMISSION_FREE_PER_WEEK: 1,

  SEGMENTS: [
    { reward: 'wallet_5', value: 5, probability: 0.20, label: '₹5', color: '#10B981' },
    { reward: 'wallet_3', value: 3, probability: 0.30, label: '₹3', color: '#3B82F6' },
    { reward: 'wallet_2', value: 2, probability: 0.25, label: '₹2', color: '#8B5CF6' },
    { reward: 'commission_free', value: 1, probability: 0.10, label: 'FREE', color: '#F59E0B' },
    { reward: 'discount_10', value: 5, probability: 0.10, label: '10% OFF', color: '#EC4899' },
    { reward: 'free_spin', value: 0, probability: 0.05, label: 'FREE!', color: '#EF4444' }
  ]
} as const;

// ==================== FILE UPLOAD ====================
export const FILE_CONFIG = {
  MAX_FILE_SIZE_TRIAL: 10 * 1024 * 1024,    // 10MB
  MAX_FILE_SIZE_STARTER: 10 * 1024 * 1024,   // 10MB
  MAX_FILE_SIZE_GROWTH: 25 * 1024 * 1024,    // 25MB
  MAX_FILE_SIZE_PREMIUM: 100 * 1024 * 1024,  // 100MB
  ALLOWED_MIME_TYPES: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png',
    'image/jpg'
  ],
  FILE_EXPIRY_HOURS: 24,
  FILE_KEEP_HOURS: 168  // 7 days
} as const;

// ==================== GEO SEARCH ====================
export const GEO_CONFIG = {
  DEFAULT_RADIUS_METERS: 5000,  // 5km default search
  MIN_RADIUS_METERS: 100,
  MAX_RADIUS_METERS: 10000
} as const;

// ==================== PAGINATION ====================
export const PAGINATION = {
  DEFAULT_PAGE: 1 as number,
  DEFAULT_LIMIT: 10 as number,
  MAX_LIMIT: 50 as number
};

// ==================== RATE LIMITING ====================
export const RATE_LIMIT = {
  AUTH: { windowMs: 60 * 1000, max: 5 },      // 5 requests per minute
  ORDER: { windowMs: 60 * 1000, max: 10 },     // 10 orders per minute
  API: { windowMs: 60 * 1000, max: 100 }       // 100 requests per minute
} as const;

// ==================== ORDER STATUS ====================
export const ORDER_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  PRINTING: 'printing',
  READY: 'ready',
  COMPLETED: 'completed',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled'
} as const;

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  REFUNDED: 'refunded'
} as const;

export const PAYMENT_METHOD = {
  WALLET: 'wallet',
  ONLINE: 'online',
  COD: 'cod'
} as const;

// ==================== USER ROLES ====================
export const USER_ROLES = {
  USER: 'user',
  VENDOR: 'vendor',
  ADMIN: 'admin'
} as const;

// ==================== VENDOR STATUS ====================
export const VENDOR_STATUS = {
  PENDING_APPROVAL: 'pending_approval',
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  PERMANENT_REVIEW: 'permanent_review'
} as const;

// ==================== DISPUTE STATUS ====================
export const DISPUTE_STATUS = {
  OPEN: 'open',
  UNDER_REVIEW: 'under_review',
  RESOLVED: 'resolved',
  ESCALATED: 'escalated'
} as const;

// ==================== EMAIL TEMPLATES ====================
export const EMAIL_TEMPLATES = {
  FROM: 'XConnect <noreply@xconnect.app>',
  SUBJECTS: {
    EMAIL_VERIFY: 'Verify your XConnect account',
    ORDER_ACCEPTED: 'Your order has been accepted!',
    ORDER_READY: 'Your prints are ready for pickup!',
    STRIKE_WARNING: 'Warning: Strike on your XConnect account',
    STRIKE_SUSPENSION: 'Your shop has been suspended',
    REFERRAL_BONUS: 'You earned ₹10 from XConnect!',
    CHALLENGE_COMPLETE: 'Challenge Completed! +₹10 in your wallet'
  }
} as const;

// ==================== PICKUP TOKEN ====================
export const PICKUP_TOKEN_LENGTH = 4;
export const PICKUP_TOKEN_PREFIX = 'ORD';

// ==================== REFERRAL CODE ====================
export const REFERRAL_CODE_LENGTH = 8;
