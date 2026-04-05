import asyncHandler from '../utils/asyncHandler.js'
import { ApiError } from '../utils/ApiError.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import { Referral } from '../models/referral.models.js'
import { User } from '../models/user.models.js'
import { Wallet } from '../models/wallet.models.js'
import logger from '../utils/logger.js'

// ── Get my referral code + stats ──────────────────────
export const getMyReferral = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).select('referralCode fullName')

    const referrals = await Referral.find({ referrerId: req.user._id })
        .populate('refereeId', 'fullName createdAt')

    const totalReferred    = referrals.length
    const bonusEarned      = referrals.filter(r => r.referralBonusCredited).length * 10
    const pendingBonus     = referrals.filter(
        r => r.signupBonusCredited && !r.referralBonusCredited
    ).length * 10

    return res.status(200).json(
        new ApiResponse(200, {
            referralCode: user.referralCode,
            referralLink: `https://xconnect.app/register?ref=${user.referralCode}`,
            totalReferred,
            bonusEarned,
            pendingBonus,
            referrals: referrals.map(r => ({
                name: r.refereeId?.fullName,
                joinedAt: r.refereeId?.createdAt,
                signupBonusCredited: r.signupBonusCredited,
                referralBonusCredited: r.referralBonusCredited,
                firstOrderAt: r.completedAt
            }))
        }, "Referral data fetched")
    )
})

// ── Internal: credit signup bonus (called from auth) ──
export const creditSignupBonus = async (userId) => {
    try {
        let wallet = await Wallet.findOne({ userId })
        if (!wallet) wallet = await Wallet.create({ userId })

        await wallet.addPromoCredit(
            10,
            'signup_bonus',
            'Welcome bonus — email & phone verified',
            null
        )

        // Mark user signup bonus credited
        await User.findByIdAndUpdate(userId, { signupBonusCredited: true })

        logger.info(`Signup bonus ₹10 credited to user ${userId}`)
    } catch (err) {
        logger.error('Signup bonus credit failed:', err.message)
    }
}

// ── Internal: credit referral bonus when referee
//             places first order ────────────────────────
// TIERED REWARD SYSTEM:
// - If referrer has < 3 total referrals: credit ₹10
// - If referrer has >= 4 total referrals: credit ₹5
// - Only triggers if order total >= ₹20
export const creditReferralBonus = async (refereeId, orderId, orderTotal) => {
    try {
        // Check minimum order amount for referral bonus
        if (orderTotal < 20) {
            logger.info(`Referral bonus skipped: order total ₹${orderTotal} < ₹20 minimum`)
            return
        }

        const referral = await Referral.findOne({
            refereeId,
            signupBonusCredited: true,
            referralBonusCredited: false
        })

        if (!referral) return // No valid referral found

        // Count total referrals for this referrer
        const totalReferrals = await Referral.countDocuments({
            referrerId: referral.referrerId,
            signupBonusCredited: true
        })

        // Determine bonus amount based on tier
        // < 3 referrals = ₹10, >= 4 referrals = ₹5
        const bonusAmount = totalReferrals < 4 ? 10 : 5

        // Credit to referrer (User A)
        let referrerWallet = await Wallet.findOne({ userId: referral.referrerId })
        if (!referrerWallet) {
            referrerWallet = await Wallet.create({ userId: referral.referrerId })
        }

        await referrerWallet.addPromoCredit(
            bonusAmount,
            'referral_bonus',
            `Referral bonus — your friend placed their first order (Tier: ${totalReferrals < 4 ? 'High' : 'Standard'})`,
            orderId
        )

        // Mark referral as complete
        referral.referralBonusCredited = true
        referral.firstOrderId = orderId
        referral.completedAt = new Date()
        referral.bonusAmount = bonusAmount
        await referral.save()

        logger.info(`Referral bonus ₹${bonusAmount} credited to user ${referral.referrerId} (total referrals: ${totalReferrals})`)
    } catch (err) {
        logger.error('Referral bonus credit failed:', err.message)
    }
}

// ── Internal: handle referral on signup ──────────────
export const handleReferralOnSignup = async (newUserId, referralCode) => {
    try {
        if (!referralCode) return

        const referrer = await User.findOne({ referralCode })
        if (!referrer) return
        if (referrer._id.toString() === newUserId.toString()) return // self refer

        // Check already referred
        const existing = await Referral.findOne({ refereeId: newUserId })
        if (existing) return

        await Referral.create({
            referrerId: referrer._id,
            refereeId: newUserId,
            referralCode
        })

        logger.info(`Referral tracked: ${referrer._id} → ${newUserId}`)
    } catch (err) {
        logger.error('Referral tracking failed:', err.message)
    }
}

// ── Internal: mark signup bonus in referral doc ───────
export const markRefereeSignupComplete = async (userId) => {
    try {
        await Referral.findOneAndUpdate(
            { refereeId: userId },
            { signupBonusCredited: true }
        )
    } catch (err) {
        logger.error('Referral signup mark failed:', err.message)
    }
}