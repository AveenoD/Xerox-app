import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
    ArrowLeft, Wallet, Gift, RotateCcw, 
    ArrowDownLeft, ArrowUpRight, Clock, 
    Info, Copy, CheckCircle 
} from 'lucide-react'
import Loader from '../../components/common/Loader.jsx'
import api from '../../utils/axios.js'

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

const WalletPage = () => {
    const [wallet, setWallet] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [copied, setCopied] = useState(false)

    const navigate = useNavigate()

    const fetchWallet = async () => {
        try {
            const res = await api.get('/wallet/me')
            setWallet(res.data.data)
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
        <div className="min-h-screen safe-area-pb"
            style={{ backgroundColor: '#0F1117' }}>

            {/* Header */}
            <div className="sticky top-0 z-10 px-4 py-4"
                style={{ backgroundColor: '#0F1117',
                         borderBottom: '1px solid #2E3148' }}>
                <div className="max-w-lg mx-auto flex items-center gap-3">
                    <button onClick={() => navigate(-1)}
                        className="w-9 h-9 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: '#1A1D27',
                                 border: '1px solid #2E3148' }}>
                        <ArrowLeft size={16} color="#F1F5F9" />
                    </button>
                    <h1 className="text-base font-semibold"
                        style={{ color: '#F1F5F9' }}>
                        My Wallet
                    </h1>
                </div>
            </div>

            <div className="max-w-lg mx-auto px-4 py-4 space-y-4">

                {/* Error */}
                {error && (
                    <div className="px-4 py-3 rounded-xl text-sm"
                        style={{ backgroundColor: '#2D1515',
                                 color: '#EF4444',
                                 border: '1px solid #EF4444' }}>
                        {error}
                    </div>
                )}

                {/* Total Balance Card */}
                <div className="p-6 rounded-2xl"
                    style={{ backgroundColor: '#1A1D27',
                             border: '1px solid #2E3148' }}>
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                            style={{ backgroundColor: '#0D2B1F' }}>
                            <Wallet size={20} color="#10B981" />
                        </div>
                        <span className="text-sm" style={{ color: '#94A3B8' }}>
                            Total Balance
                        </span>
                    </div>
                    
                    <p className="text-4xl font-bold mb-4" style={{ color: '#F1F5F9' }}>
                        ₹{wallet?.totalBalance || 0}
                    </p>

                    {/* Balance Breakdown */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 rounded-xl"
                            style={{ backgroundColor: '#222536' }}>
                            <div className="flex items-center gap-1.5 mb-1">
                                <Gift size={12} color="#10B981" />
                                <span className="text-xs" style={{ color: '#64748B' }}>
                                    Promotional
                                </span>
                            </div>
                            <p className="text-lg font-semibold" style={{ color: '#F1F5F9' }}>
                                ₹{wallet?.promotionalBalance || 0}
                            </p>
                            <p className="text-xs mt-0.5" style={{ color: '#64748B' }}>
                                Expires in 7 days
                            </p>
                        </div>

                        <div className="p-3 rounded-xl"
                            style={{ backgroundColor: '#222536' }}>
                            <div className="flex items-center gap-1.5 mb-1">
                                <RotateCcw size={12} color="#3B82F6" />
                                <span className="text-xs" style={{ color: '#64748B' }}>
                                    Refunded
                                </span>
                            </div>
                            <p className="text-lg font-semibold" style={{ color: '#F1F5F9' }}>
                                ₹{wallet?.refundedBalance || 0}
                            </p>
                            <p className="text-xs mt-0.5" style={{ color: '#64748B' }}>
                                No expiry
                            </p>
                        </div>
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

            </div>
        </div>
    )
}

export default WalletPage
