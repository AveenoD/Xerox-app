import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
    ArrowLeft, Wallet, Gift, RotateCcw, Crown,
    ArrowDownLeft, ArrowUpRight, Clock, Zap, Percent,
    Info, Copy, CheckCircle, ChevronRight, Shield
} from 'lucide-react'
import Loader from '../../components/common/Loader.jsx'
import api from '../../utils/axios.js'

/**
 * Wallet & XConnect Pro Screen
 * 
 * API Endpoints:
 * - GET /api/wallet/me - Get wallet balance and transactions
 *   Response: { promotionalBalance, refundedBalance, totalBalance, transactions[] }
 * 
 * - GET /api/vendor-plans/me - Get current vendor plan (if vendor)
 *   Response: { plan, ordersUsedThisMonth, ordersLimit, isActive }
 */

const TRANSACTION_ICONS = {
    signup_bonus: Gift,
    referral_bonus: Gift,
    referee_bonus: Gift,
    refund: RotateCcw,
    debit: ArrowUpRight,
    booking_fee: Wallet
}

const TRANSACTION_LABELS = {
    signup_bonus: 'Signup Bonus',
    referral_bonus: 'Referral Bonus',
    referee_bonus: 'Referee Bonus',
    refund: 'Refund',
    debit: 'Payment',
    booking_fee: 'Booking Fee'
}

const PRO_BENEFITS = [
    { icon: Percent, label: 'Zero Platform Fees', desc: 'Keep 100% of your earnings' },
    { icon: Zap, label: 'Priority Printing', desc: 'Skip the queue on busy days' },
    { icon: Shield, label: '10% Off Binding', desc: 'Discount on all binding services' },
]

const WalletPage = () => {
    const [wallet, setWallet] = useState(null)
    const [plan, setPlan] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [copied, setCopied] = useState(false)
    const [isPro, setIsPro] = useState(false)

    const navigate = useNavigate()

    const fetchWallet = async () => {
        try {
            const [walletRes, planRes] = await Promise.all([
                api.get('/wallet/me'),
                api.get('/vendor-plans/me').catch(() => ({ data: { data: null } }))
            ])
            setWallet(walletRes.data.data)
            setPlan(planRes.data.data)
            setIsPro(planRes.data.data?.plan === 'pro')
        } catch (err) {
            setError('Could not load wallet')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchWallet()
    }, [])

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    if (loading) return <Loader />

    return (
        <div className="min-h-screen safe-area-pb" style={{ backgroundColor: '#0F172A' }}>
            {/* Header */}
            <header className="sticky top-0 z-10 px-4 py-4 safe-area-pt"
                style={{ 
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    backdropFilter: 'blur(12px)',
                    borderBottom: '1px solid rgba(51, 65, 85, 0.5)'
                }}>
                <div className="max-w-lg mx-auto flex items-center gap-3">
                    <button 
                        onClick={() => navigate(-1)}
                        className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors active:scale-95"
                        style={{ backgroundColor: 'rgba(30, 41, 59, 0.7)' }}>
                        <ArrowLeft size={20} color="#F1F5F9" />
                    </button>
                    <h1 className="text-lg font-bold" style={{ color: '#F1F5F9' }}>
                        Wallet & Pro
                    </h1>
                </div>
            </header>

            <main className="max-w-lg mx-auto px-4 py-4 space-y-4">
                {/* Error */}
                {error && (
                    <div className="p-4 rounded-xl flex items-center gap-3 animate-fade-in"
                        style={{ 
                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.3)'
                        }}>
                        <Info size={20} color="#EF4444" />
                        <p className="text-sm" style={{ color: '#EF4444' }}>{error}</p>
                    </div>
                )}

                {/* Wallet Balance Card */}
                <div className="glass-card p-6 relative overflow-hidden">
                    {/* Background gradient decoration */}
                    <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10"
                        style={{ 
                            background: 'radial-gradient(circle, #10B981 0%, transparent 70%)',
                            transform: 'translate(30%, -30%)'
                        }} />
                    
                    <div className="relative">
                        <div className="flex items-center gap-3 mb-4">
                            <div 
                                className="w-12 h-12 rounded-xl flex items-center justify-center"
                                style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)' }}>
                                <Wallet size={24} color="#10B981" />
                            </div>
                            <div>
                                <p className="text-sm" style={{ color: '#94A3B8' }}>Total Balance</p>
                                <p className="text-3xl font-bold" style={{ color: '#F1F5F9' }}>
                                    ₹{wallet?.totalBalance?.toFixed(2) || '0.00'}
                                </p>
                            </div>
                        </div>

                        {/* Top Up Button */}
                        <button
                            className="w-full py-3 rounded-xl font-semibold text-sm transition-all active:scale-[0.98]"
                            style={{ 
                                backgroundColor: '#10B981',
                                color: '#ffffff',
                                boxShadow: '0 4px 20px rgba(16, 185, 129, 0.3)'
                            }}
                        >
                            Top Up Wallet
                        </button>

                        {/* Balance Breakdown */}
                        <div className="grid grid-cols-2 gap-3 mt-4">
                            <div className="p-3 rounded-xl"
                                style={{ backgroundColor: 'rgba(30, 41, 59, 0.5)' }}>
                                <div className="flex items-center gap-1.5 mb-1">
                                    <Gift size={12} color="#10B981" />
                                    <span className="text-xs" style={{ color: '#64748B' }}>
                                        Promotional
                                    </span>
                                </div>
                                <p className="text-lg font-semibold" style={{ color: '#F1F5F9' }}>
                                    ₹{wallet?.promotionalBalance || 0}
                                </p>
                            </div>

                            <div className="p-3 rounded-xl"
                                style={{ backgroundColor: 'rgba(30, 41, 59, 0.5)' }}>
                                <div className="flex items-center gap-1.5 mb-1">
                                    <RotateCcw size={12} color="#3B82F6" />
                                    <span className="text-xs" style={{ color: '#64748B' }}>
                                        Refunded
                                    </span>
                                </div>
                                <p className="text-lg font-semibold" style={{ color: '#F1F5F9' }}>
                                    ₹{wallet?.refundedBalance || 0}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* XConnect Pro Section */}
                <div className={`glass-card p-5 relative overflow-hidden ${isPro ? 'border-amber-500/30' : ''}`}
                    style={{ borderColor: isPro ? 'rgba(245, 158, 11, 0.3)' : undefined }}>
                    {/* Gold gradient background for Pro */}
                    {!isPro && (
                        <div className="absolute inset-0 opacity-5"
                            style={{ 
                                background: 'linear-gradient(135deg, #F59E0B 0%, #FBBF24 50%, #F59E0B 100%)'
                            }} />
                    )}
                    
                    <div className="relative">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div 
                                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                                    style={{ 
                                        backgroundColor: isPro ? 'rgba(245, 158, 11, 0.2)' : 'rgba(245, 158, 11, 0.1)',
                                        border: isPro ? '1px solid rgba(245, 158, 11, 0.3)' : 'none'
                                    }}>
                                    <Crown size={24} color="#F59E0B" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold" style={{ color: '#F59E0B' }}>
                                        XConnect Pro
                                    </h3>
                                    <p className="text-xs" style={{ color: '#64748B' }}>
                                        {isPro ? 'Active Plan' : 'Upgrade for premium benefits'}
                                    </p>
                                </div>
                            </div>
                            {isPro && (
                                <span className="px-3 py-1 rounded-full text-xs font-semibold"
                                    style={{ 
                                        backgroundColor: 'rgba(245, 158, 11, 0.15)',
                                        color: '#F59E0B'
                                    }}>
                                    ACTIVE
                                </span>
                            )}
                        </div>

                        {/* Benefits List */}
                        <div className="space-y-3 mb-5">
                            {PRO_BENEFITS.map((benefit, index) => {
                                const Icon = benefit.icon
                                return (
                                    <div key={index} className="flex items-center gap-3">
                                        <div 
                                            className="w-8 h-8 rounded-lg flex items-center justify-center"
                                            style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)' }}>
                                            <Icon size={16} color="#F59E0B" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium" style={{ color: '#F1F5F9' }}>
                                                {benefit.label}
                                            </p>
                                            <p className="text-xs" style={{ color: '#64748B' }}>
                                                {benefit.desc}
                                            </p>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                        {/* CTA Button */}
                        <button
                            className="w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                            style={{ 
                                background: isPro 
                                    ? 'rgba(245, 158, 11, 0.15)' 
                                    : 'linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)',
                                color: isPro ? '#F59E0B' : '#0F172A',
                                border: isPro ? '1px solid rgba(245, 158, 11, 0.3)' : 'none'
                            }}
                        >
                            {isPro ? 'Manage Subscription' : 'Upgrade for ₹49/mo'}
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>

                {/* How to Earn Section */}
                <div className="p-4 rounded-2xl"
                    style={{ backgroundColor: '#1A1D27',
                             border: '1px solid #2E3148' }}>
                    <h3 className="text-sm font-semibold mb-3"
                        style={{ color: '#F1F5F9' }}>
                        How to Earn
                    </h3>
                    
                    <div className="space-y-3">
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                                style={{ backgroundColor: '#0D2B1F' }}>
                                <Gift size={14} color="#10B981" />
                            </div>
                            <div>
                                <p className="text-sm font-medium" style={{ color: '#F1F5F9' }}>
                                    Signup Bonus
                                </p>
                                <p className="text-xs" style={{ color: '#64748B' }}>
                                    Get ₹10 when you verify email & phone
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                                style={{ backgroundColor: '#0D1B2B' }}>
                                <span className="text-sm" style={{ color: '#3B82F6' }}>👥</span>
                            </div>
                            <div>
                                <p className="text-sm font-medium" style={{ color: '#F1F5F9' }}>
                                    Refer Friends
                                </p>
                                <p className="text-xs" style={{ color: '#64748B' }}>
                                    Get ₹10 when friend signs up + ₹10 on first order
                                </p>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={() => navigate('/referral')}
                        className="w-full mt-4 py-2.5 rounded-xl text-sm font-medium"
                        style={{ backgroundColor: '#10B981', color: '#ffffff' }}>
                        Invite Friends
                    </button>
                </div>

                {/* Transaction History */}
                <div>
                    <h3 className="text-sm font-semibold mb-3"
                        style={{ color: '#F1F5F9' }}>
                        Recent Transactions
                    </h3>

                    {wallet?.transactions?.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12"
                            style={{ backgroundColor: '#1A1D27',
                                     border: '1px solid #2E3148',
                                     borderRadius: '1rem' }}>
                            <Wallet size={40} color="#2E3148" className="mb-3" />
                            <p className="text-sm" style={{ color: '#64748B' }}>
                                No transactions yet
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {wallet?.transactions?.map((txn, index) => {
                                const Icon = TRANSACTION_ICONS[txn.type] || Wallet
                                const isCredit = txn.type !== 'debit' && txn.type !== 'booking_fee'
                                
                                return (
                                    <div key={index}
                                        className="p-3 rounded-xl flex items-center gap-3"
                                        style={{ backgroundColor: '#1A1D27',
                                                 border: '1px solid #2E3148' }}>
                                        <div className="w-10 h-10 rounded-lg flex items-center justify-center"
                                            style={{ backgroundColor: isCredit ? '#0D2B1F' : '#2D1515' }}>
                                            <Icon 
                                                size={18} 
                                                color={isCredit ? '#10B981' : '#EF4444'} 
                                            />
                                        </div>
                                        
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate"
                                                style={{ color: '#F1F5F9' }}>
                                                {TRANSACTION_LABELS[txn.type] || txn.type}
                                            </p>
                                            <p className="text-xs truncate"
                                                style={{ color: '#64748B' }}>
                                                {txn.description}
                                            </p>
                                            {txn.expiresAt && !txn.isExpired && (
                                                <p className="text-xs mt-0.5 flex items-center gap-1"
                                                    style={{ color: '#EAB308' }}>
                                                    <Clock size={10} />
                                                    Expires {new Date(txn.expiresAt).toLocaleDateString()}
                                                </p>
                                            )}
                                        </div>

                                        <div className="text-right">
                                            <p className={`text-sm font-semibold ${
                                                isCredit ? '' : ''
                                            }`}
                                                style={{ color: isCredit ? '#10B981' : '#EF4444' }}>
                                                {isCredit ? '+' : '-'}₹{txn.amount}
                                            </p>
                                            <p className="text-xs" style={{ color: '#64748B' }}>
                                                {new Date(txn.createdAt).toLocaleDateString('en-IN', {
                                                    day: 'numeric',
                                                    month: 'short'
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>

                {/* Info Note */}
                <div className="p-3 rounded-xl flex items-start gap-2"
                    style={{ backgroundColor: '#1A1D27',
                             border: '1px solid #2E3148' }}>
                    <Info size={14} color="#64748B" className="flex-shrink-0 mt-0.5" />
                    <p className="text-xs" style={{ color: '#64748B' }}>
                        Promotional balance expires 7 days after credit. 
                        Refunded balance has no expiry. Wallet can be used for order payments.
                    </p>
                </div>

            </main>
        </div>
    )
}

export default WalletPage
