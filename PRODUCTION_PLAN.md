# XConnect — Production Plan (Backend First)

## Versions Overview

```
┌─────────────────────────────────────────────────────────────┐
│  VERSION 1 — Core MVP                                      │
│  Email OTP → Browse Vendors → Upload PDF → Order → Pickup  │
│  Timeline: Weeks 1-3                                        │
├─────────────────────────────────────────────────────────────┤
│  VERSION 2 — Engagement                                     │
│  Referral, Challenges, Spin & Win, Wallet                  │
│  Timeline: Weeks 4-5                                       │
├─────────────────────────────────────────────────────────────┤
│  VERSION 3 — Admin + Vendor Management                     │
│  Admin Panel (YOU), Strike System, Vendor Dashboard        │
│  Timeline: Weeks 6-7                                       │
├─────────────────────────────────────────────────────────────┤
│  VERSION 4 — Subscriptions + Polish (FINAL)                │
│  3-Tier Plans, Payments, Legal Pages, SEO Ready             │
│  Timeline: Weeks 8-10                                       │
└─────────────────────────────────────────────────────────────┘
```

**Key Decisions:**
- **Backend FIRST** → Then Frontend (Next.js later)
- **Email OTP only** — Phone OTP skip (no budget for SMS OTP service)
- **Version 4 is FINAL** — Payments added last
- **Next.js Frontend** — Later (SEO + website visitors)
- **UI Reference**: Google Stitch (https://stitch.withgoogle.com/projects/14580418838929781730)
- **Home page** — Visitors see home → Book only (verify email OTP)

---

# PHASE 0 — Email OTP Setup

## Why No Phone OTP

- SMS OTP service costs money (₹300-500/month)
- Email OTP is FREE (using Resend)
- Phone number stored as unique field (no OTP verification)

## Phone Number Storage

```typescript
// User model - phone verified via email OTP confirmation only
phone: string          // Stored, unique
isPhoneVerified: boolean  // Default: false (email OTP verifies account)
phoneVerifiedAt: Date     // Set when email OTP verified
```

**Flow:**
```
User enters email + phone → Email OTP sent → Verify email OTP
        ↓
Account created → Phone marked as "basic verified"
(No separate phone OTP)
```

**Note:** If free reverse SMS service available later → add phone OTP then

---

# VERSION 1 — Core MVP (Weeks 1-3)

## Database Models

### User Model
```typescript
{
  _id: ObjectId,
  fullName: string,
  email: string (unique),
  password: string (hashed),
  phone: string (unique, +91xxxxxxxxxx),
  role: 'user' | 'vendor' | 'admin',
  isEmailVerified: boolean,
  emailVerifiedAt: Date,
  avatar: string (URL),
  location: {
    type: 'Point',
    coordinates: [longitude, latitude]
  },
  address: {
    street: string,
    city: string,
    state: string,
    pincode: string
  },
  referralCode: string (unique, XCA1B2C3 format),
  referredBy: ObjectId (ref: User),
  walletBalance: number (default: 0),
  promoBalance: number (default: 0),
  createdAt: Date,
  updatedAt: Date
}
```

### VendorProfile Model
```typescript
{
  _id: ObjectId,
  userId: ObjectId (ref: User, unique),
  shopName: string,
  shopAddress: string,
  shopPhoto: string (URL),
  location: {
    type: 'Point',
    coordinates: [longitude, latitude]
  },
  isOpen: boolean (default: true),
  pricing: {
    A4: {
      bw_single: number,
      bw_double: number,
      color_single: number,
      color_double: number
    },
    A3: {
      bw_single: number,
      bw_double: number,
      color_single: number,
      color_double: number
    },
    Legal: { ... }
  },
  plan: 'trial' | 'starter' | 'growth' | 'premium',
  trialEndsAt: Date,
  subscriptionEndsAt: Date,
  slaMinutes: number,
  strikes: number (default: 0),
  strikeHistory: [{
    reason: string,
    orderId: ObjectId,
    timestamp: Date,
    slaMinutes: number
  }],
  totalOrders: number,
  completedOrders: number,
  averageRating: number,
  totalRatings: number,
  status: 'pending_approval' | 'active' | 'suspended' | 'permanent_review',
  suspendedUntil: Date,
  suspendReason: string,
  isVerified: boolean (default: false),
  verifiedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Order Model
```typescript
{
  _id: ObjectId,
  orderId: string (ORD-XXXXXX),
  customerId: ObjectId (ref: User),
  vendorId: ObjectId (ref: VendorProfile),
  fileName: string,
  fileUrl: string (original - customer only),
  previewUrl: string (watermarked - vendor),
  pageCount: number,
  originalFileSize: number (bytes),
  printConfig: {
    paperSize: 'A4' | 'A3' | 'Legal',
    printType: 'bw_single' | 'bw_double' | 'color_single' | 'color_double',
    copies: number (default: 1)
  },
  printCost: number,
  platformFee: number (₹2/₹3/₹5/₹8),
  totalAmount: number,
  status: 'pending' | 'accepted' | 'printing' | 'ready' | 'completed' | 'rejected' | 'cancelled',
  statusHistory: [{
    status: string,
    timestamp: Date,
    note: string
  }],
  slaDeadline: Date,
  slaAcceptedAt: Date,
  slaBreached: boolean (default: false),
  pickupToken: string (4-digit),
  estimatedReadyTime: Date,
  actualReadyTime: Date,
  paymentStatus: 'pending' | 'paid' | 'refunded',
  paymentMethod: 'wallet' | 'online' | 'cod',
  vendorNotes: string,
  customerNotes: string,
  copies: number,
  fileDeleteAt: Date,
  keepForFuture: boolean (default: false),
  countedForChallenge: {
    firstOrder: boolean,
    consistentUser: boolean
  },
  createdAt: Date,
  updatedAt: Date
}
```

### Wallet Model
```typescript
{
  _id: ObjectId,
  userId: ObjectId (ref: User, unique),
  balance: number (real money),
  promoBalance: number (bonuses),
  transactions: [{
    type: 'credit' | 'debit',
    amount: number,
    source: 'referral' | 'challenge' | 'spin_win' | 'order_refund' | 'order_payment' | 'spin_cost' | 'topup',
    description: string,
    relatedOrderId: ObjectId,
    expiresAt: Date,
    balanceAfter: number,
    createdAt: Date
  }]
}
```

---

## V1 Features

### Authentication
- [ ] Email OTP (Resend) — ONLY verification
- [ ] Password login (bcrypt + JWT)
- [ ] Access token (15 min)
- [ ] Refresh token (7 days)
- [ ] Email domain blocker (allowed list only)
- [ ] T&C acceptance during registration

### User Features
- [ ] Browse nearby vendors (geo-search)
- [ ] View vendor details (pricing, rating, distance)
- [ ] Upload PDF (Multer + Cloudinary)
- [ ] Select print options (paper, type, copies)
- [ ] Create order
- [ ] View order status
- [ ] Cancel pending order
- [ ] Rate completed order
- [ ] Keep file for future

### Vendor Features
- [ ] Shop registration
- [ ] Pricing matrix setup
- [ ] GPS coordinates
- [ ] Dashboard (order queue)
- [ ] SLA countdown timer
- [ ] Accept / Reject orders
- [ ] Mark printing / Ready
- [ ] Toggle open/close
- [ ] Basic analytics

### Backend Logic
- [ ] Geo-spatial indexing (2dsphere)
- [ ] SLA checker job (every 30 sec)
- [ ] File expiry job (every hour)
- [ ] Pickup token generator
- [ ] Document security (watermarked preview)

---

# VERSION 2 — Engagement (Weeks 4-5)

## Referral System
- [ ] ₹10 signup bonus (7-day expiry)
- [ ] ₹10 referrer (first 3 referrals)
- [ ] ₹5 referrer (4th onwards)

## Challenge System
- [ ] First Print: ₹10 on 1st order
- [ ] Early Bird: ₹5 within 24hr
- [ ] Consistent User: ₹5 for 3 orders

## Spin & Win
- [ ] ₹1 spin OR watch ad
- [ ] 6-segment wheel
- [ ] Max 10 spins/day
- [ ] ₹50 daily cap

## Wallet
- [ ] Balance + promo balance
- [ ] Transaction history
- [ ] Order payment

---

# VERSION 3 — Admin + Vendor Management (Weeks 6-7)

## Admin Panel (YOU = Super Admin)

### Dashboard
- [ ] Overview (orders, revenue, users, vendors)
- [ ] Alerts
- [ ] Charts

### Vendor Management
- [ ] Vendor list
- [ ] Vendor detail
- [ ] Add/Remove strikes
- [ ] Suspend (24hr/72hr/custom)
- [ ] Permanent ban
- [ ] Reset password
- [ ] Audit log

### User Management
- [ ] User list
- [ ] User detail
- [ ] Block/Unblock

### Order Management
- [ ] Order list
- [ ] Order detail
- [ ] Admin actions

### Dispute Management
- [ ] Dispute list
- [ ] Resolution options

### Transaction Management
- [ ] All transactions
- [ ] Revenue report
- [ ] Export CSV

### Settings
- [ ] Platform fees
- [ ] Referral rewards
- [ ] Challenge rewards
- [ ] SLA times
- [ ] T&C / Privacy content

### Audit Log
- [ ] All admin actions

---

# VERSION 4 — Subscriptions + Polish (FINAL) (Weeks 8-10)

## Subscription Plans

| Feature | Starter ₹149 | Growth ₹299 | Premium ₹499 |
|---------|:------------:|:------------:|:------------:|
| SLA | 2 min | 3 min | 3 min |
| Radius | 250m | 1 km | 3 km |
| Daily orders | 15 | Unlimited | Unlimited |
| Priority | Normal | Higher | Highest |
| Verified badge | No | Yes | Yes |
| File size | 10MB | 25MB | 100MB |
| Analytics | Basic | Advanced | Full + export |

- 1 month FREE trial for all

## Payments (Cashfree)
- [ ] Order payment
- [ ] Wallet top-up
- [ ] Subscription payment
- [ ] Webhook handler

## Legal
- [ ] Terms & Conditions
- [ ] Privacy Policy

---

## Backend Files to Create (TypeScript)

```
backend/src/
├── config/
│   ├── constants.ts
│   ├── database.ts
│   ├── allowedEmailDomains.ts
│   └── cloudinary.ts
│
├── models/
│   ├── user.model.ts
│   ├── vendorProfile.model.ts
│   ├── order.model.ts
│   ├── wallet.model.ts
│   ├── referral.model.ts
│   ├── challenge.model.ts
│   ├── spinRecord.model.ts
│   ├── subscription.model.ts
│   ├── dispute.model.ts
│   └── auditLog.model.ts
│
├── services/
│   ├── auth.service.ts
│   ├── order.service.ts
│   ├── vendor.service.ts
│   ├── subscription.service.ts
│   ├── payment.service.ts
│   ├── notification.service.ts
│   ├── referral.service.ts
│   ├── challenge.service.ts
│   ├── spinGame.service.ts
│   ├── wallet.service.ts
│   └── analytics.service.ts
│
├── controllers/
│   ├── auth.controller.ts
│   ├── order.controller.ts
│   ├── vendor.controller.ts
│   ├── subscription.controller.ts
│   ├── payment.controller.ts
│   ├── referral.controller.ts
│   ├── challenge.controller.ts
│   ├── spinGame.controller.ts
│   ├── wallet.controller.ts
│   └── admin.controller.ts
│
├── routes/
│   ├── auth.routes.ts
│   ├── order.routes.ts
│   ├── vendor.routes.ts
│   ├── subscription.routes.ts
│   ├── payment.routes.ts
│   ├── referral.routes.ts
│   ├── challenge.routes.ts
│   ├── spinGame.routes.ts
│   ├── wallet.routes.ts
│   └── admin.routes.ts
│
├── middlewares/
│   ├── auth.middleware.ts
│   ├── admin.middleware.ts
│   ├── emailValidator.middleware.ts
│   ├── errorHandler.middleware.ts
│   ├── rateLimiter.middleware.ts
│   └── multer.middleware.ts
│
├── jobs/
│   ├── slaChecker.job.ts
│   ├── fileExpiry.job.ts
│   ├── subscriptionExpiry.job.ts
│   ├── walletExpiry.job.ts
│   ├── challengeChecker.job.ts
│   └── strikeDecay.job.ts
│
├── socket/
│   ├── index.ts
│   ├── vendorSocket.ts
│   └── customerSocket.ts
│
├── validators/
│   ├── auth.validator.ts
│   ├── order.validator.ts
│   └── vendor.validator.ts
│
├── admin/
│   ├── dashboard.controller.ts
│   ├── vendor.controller.ts
│   ├── user.controller.ts
│   ├── order.controller.ts
│   ├── dispute.controller.ts
│   └── settings.controller.ts
│
├── types/
│   ├── user.types.ts
│   ├── order.types.ts
│   ├── vendor.types.ts
│   └── index.ts
│
├── utils/
│   ├── ApiError.ts
│   ├── ApiResponse.ts
│   ├── asyncHandler.ts
│   └── logger.ts
│
├── app.ts
└── index.ts

backend/public/legal/
├── terms.html
└── privacy.html

backend/scripts/
├── createAdminUser.ts
└── seedDemoData.ts

backend/tsconfig.json
backend/package.json
backend/.env.example
backend/Dockerfile
backend/docker-compose.yml
```

---

## Implementation Start

**Jab ready ho → batao VERSION 1 se backend shuru karte hain!**
