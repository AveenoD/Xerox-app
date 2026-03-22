import asyncHandler from '../utils/asyncHandler.js'
import { ApiError } from '../utils/ApiError.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import { Wallet } from '../models/wallet.models.js'

// ── Get wallet balance + transactions ─────────────────
export const getWallet = asyncHandler(async (req, res) => {
    let wallet = await Wallet.findOne({ userId: req.user._id })

    // Auto-create wallet if not exists
    if (!wallet) {
        wallet = await Wallet.create({ userId: req.user._id })
    }

    // Expire promotional transactions past 7 days
    const now = new Date()
    let needsSave = false
    let expiredAmount = 0

    wallet.transactions.forEach(txn => {
        if (
            txn.balanceType === 'promotional' &&
            txn.expiresAt &&
            txn.expiresAt < now &&
            !txn.isExpired &&
            txn.type !== 'debit'
        ) {
            txn.isExpired = true
            expiredAmount += txn.amount
            needsSave = true
        }
    })

    if (expiredAmount > 0) {
        wallet.promotionalBalance = Math.max(0, wallet.promotionalBalance - expiredAmount)
        needsSave = true
    }

    if (needsSave) await wallet.save()

    return res.status(200).json(
        new ApiResponse(200, {
            promotionalBalance: wallet.promotionalBalance,
            refundedBalance: wallet.refundedBalance,
            totalBalance: wallet.promotionalBalance + wallet.refundedBalance,
            transactions: wallet.transactions
                .sort((a, b) => b.createdAt - a.createdAt)
                .slice(0, 20) // last 20 transactions
        }, "Wallet fetched")
    )
})