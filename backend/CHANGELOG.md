# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-04-15

### Added

#### Authentication
- Email OTP registration with 6-digit verification code
- Email domain whitelist validation (gmail.com, yahoo.com, outlook.com, etc.)
- Email domain blacklist blocking (tempmail.com, mailinator.com, etc.)
- JWT access tokens (15min expiry) and refresh tokens (7 days)
- Password hashing with bcrypt (10 rounds)

#### User Management
- User registration with full name, email, phone
- Referral code generation on signup (6-character alphanumeric)
- Wallet system with balance and promo balance tracking
- Location storage with GeoJSON support

#### Vendor Management
- Vendor registration with shop details and GPS coordinates
- Pricing matrix (A4/A3/Legal × B&W/Color × Single/Double)
- Subscription plans (Starter ₹149, Growth ₹299, Premium ₹499)
- 1-month FREE trial for all new vendors
- SLA grace periods based on plan (2min Starter, 3min others)
- Strike system with automatic suspension

#### Order System
- Order creation with file upload and print configuration
- SLA countdown timer (auto-cancel if not accepted in time)
- Order status lifecycle: pending → accepted → printing → ready → completed
- Pickup token generation for order identification
- Platform fee calculation (page-wise: ₹2/₹3/₹5/₹8)

#### Referral System
- Referral code generation on user signup
- ₹10 signup bonus for referee (7-day expiry)
- Referral tier rewards: ₹10 (first 3 referrals), ₹5 (4th onwards)
- Referral tracking with pending/earned status

#### Challenge System
- First print challenge: ₹10 reward on 1st order
- Early bird challenge: ₹5 reward for order within 24hr of signup
- Consistent user challenge: ₹5 reward for 3 orders in 30 days
- Progress tracking with expiry

#### Wallet System
- Dual balance: real balance + promo balance
- Transaction history with pagination
- Promo balance priority deduction on payments
- Referral, challenge, and signup bonus credits

#### Real-Time
- Socket.io server with /vendor and /customer namespaces
- Vendor order notifications (new order, SLA expired)
- Customer order updates (accepted, printing, ready, completed)
- JWT authentication for socket connections

#### Background Jobs
- SLA checker: runs every 30 seconds for expired pending orders
- File expiry: auto-delete files after 24 hours

### Security
- Helmet.js security headers
- Rate limiting on auth routes (5/min), order routes (10/min), API (100/min)
- Input validation with Zod
- CORS whitelist configuration

### Configuration
- Centralized constants (platform fees, SLA times, subscription plans, referral tiers)
- Environment variable management with .env.example

### Documentation
- OpenAPI 3.0 specification (openapi.yml)
- Swagger UI endpoint (/api/docs)

## [0.0.0] - 2026-01-01

### Initial
- Project initialization with JavaScript (prior to TypeScript migration)