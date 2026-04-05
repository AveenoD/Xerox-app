import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
    ArrowLeft, Users, Gift, Copy, CheckCircle,
    Share2, ChevronRight, UserPlus, ShoppingBag,
    Mail, MessageCircle
} from 'lucide-react'
import Loader from '../../components/common/Loader.jsx'
import api from '../../utils/axios.js'

const Referral = () => {
    const [referralData, setReferralData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [copied, setCopied] = useState(false)
    const [shareError, setShareError] = useState('')

    const navigate = useNavigate()

    const fetchReferralData = async () => {
        try {
            const res = await api.get('/referral/me')
            setReferralData(res.data.data)
        } catch (err) {
            setError('Could not load referral data')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchReferralData()
    }, [])

    const copyCode = () => {
        navigator.clipboard.writeText(referralData?.referralCode)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const copyLink = () => {
        navigator.clipboard.writeText(referralData?.referralLink)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const shareNative = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Join XConnect - Print Shop Marketplace',
                    text: `Use my referral code ${referralData?.referralCode} and get ₹10 bonus!`,
                    url: referralData?.referralLink
                })
            } catch (err) {
                // User cancelled or share failed
            }
        } else {
            setShareError('Sharing not supported on this device')
            setTimeout(() => setShareError(''), 3000)
        }
    }

    const shareViaWhatsApp = () => {
        const text = encodeURIComponent(
            `Join XConnect - Print Shop Marketplace!\n\n` +
            `Use my referral code: ${referralData?.referralCode}\n\n` +
            `Get ₹10 signup bonus when you verify your email & phone!\n\n` +
            `${referralData?.referralLink}`
        )
        window.open(`https://wa.me/?text=${text}`, '_blank')
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
                        Refer & Earn
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

                {shareError && (
                    <div className="px-4 py-3 rounded-xl text-sm"
                        style={{ backgroundColor: '#2D2000',
                                 color: '#EAB308',
                                 border: '1px solid #EAB308' }}>
                        {shareError}
                    </div>
                )}

                {/* Hero Card */}
                <div className="p-6 rounded-2xl text-center"
                    style={{ backgroundColor: '#1A1D27',
                             border: '1px solid #2E3148' }}>
                    <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                        style={{ backgroundColor: '#0D2B1F' }}>
                        <Gift size={32} color="#10B981" />
                    </div>
                    
                    <h2 className="text-xl font-bold mb-2" style={{ color: '#F1F5F9' }}>
                        Earn ₹20 Per Friend
                    </h2>
                    <p className="text-sm mb-6" style={{ color: '#94A3B8' }}>
                        Share your code and earn when friends join & order
                    </p>

                    {/* Referral Code */}
                    <div className="p-4 rounded-xl mb-4"
                        style={{ backgroundColor: '#0F1117' }}>
                        <p className="text-xs mb-2" style={{ color: '#64748B' }}>
                            Your Referral Code
                        </p>
                        <div className="flex items-center justify-center gap-3">
                            <span className="text-3xl font-bold tracking-widest"
                                style={{ color: '#10B981' }}>
                                {referralData?.referralCode}
                            </span>
                            <button
                                onClick={copyCode}
                                className="w-9 h-9 rounded-lg flex items-center justify-center"
                                style={{ backgroundColor: '#1A1D27',
                                         border: '1px solid #2E3148' }}>
                                {copied ? (
                                    <CheckCircle size={16} color="#10B981" />
                                ) : (
                                    <Copy size={16} color="#64748B" />
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Share Buttons */}
                    <div className="flex gap-2">
                        <button
                            onClick={shareNative}
                            className="flex-1 py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2"
                            style={{ backgroundColor: '#10B981', color: '#ffffff' }}>
                            <Share2 size={16} />
                            Share
                        </button>
                        <button
                            onClick={shareViaWhatsApp}
                            className="flex-1 py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2"
                            style={{ backgroundColor: '#0D2B1F',
                                     color: '#10B981',
                                     border: '1px solid #10B981' }}>
                            <MessageCircle size={16} />
                            WhatsApp
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-3 gap-3">
                    <div className="p-4 rounded-2xl text-center"
                        style={{ backgroundColor: '#1A1D27',
                                 border: '1px solid #2E3148' }}>
                        <Users size={20} color="#3B82F6" className="mx-auto mb-2" />
                        <p className="text-xl font-bold" style={{ color: '#F1F5F9' }}>
                            {referralData?.totalReferred || 0}
                        </p>
                        <p className="text-xs" style={{ color: '#64748B' }}>
                            Referred
                        </p>
                    </div>

                    <div className="p-4 rounded-2xl text-center"
                        style={{ backgroundColor: '#1A1D27',
                                 border: '1px solid #2E3148' }}>
                        <CheckCircle size={20} color="#10B981" className="mx-auto mb-2" />
                        <p className="text-xl font-bold" style={{ color: '#F1F5F9' }}>
                            {referralData?.referrals?.filter(r => r.referralBonusCredited).length || 0}
                        </p>
                        <p className="text-xs" style={{ color: '#64748B' }}>
                            Completed
                        </p>
                    </div>

                    <div className="p-4 rounded-2xl text-center"
                        style={{ backgroundColor: '#1A1D27',
                                 border: '1px solid #2E3148' }}>
                        <Gift size={20} color="#EAB308" className="mx-auto mb-2" />
                        <p className="text-xl font-bold" style={{ color: '#F1F5F9' }}>
                            ₹{referralData?.bonusEarned || 0}
                        </p>
                        <p className="text-xs" style={{ color: '#64748B' }}>
                            Earned
                        </p>
                    </div>
                </div>

                {/* How It Works */}
                <div className="p-4 rounded-2xl"
                    style={{ backgroundColor: '#1A1D27',
                             border: '1px solid #2E3148' }}>
                    <h3 className="text-sm font-semibold mb-4"
                        style={{ color: '#F1F5F9' }}>
                        How It Works
                    </h3>
                    
                    <div className="space-y-4">
                        <div className="flex items-start gap-3">
                            <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold"
                                style={{ backgroundColor: '#10B981', color: '#ffffff' }}>
                                1
                            </div>
                            <div>
                                <p className="text-sm font-medium" style={{ color: '#F1F5F9' }}>
                                    Share Your Code
                                </p>
                                <p className="text-xs" style={{ color: '#64748B' }}>
                                    Share your unique referral code with friends
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold"
                                style={{ backgroundColor: '#10B981', color: '#ffffff' }}>
                                2
                            </div>
                            <div>
                                <p className="text-sm font-medium" style={{ color: '#F1F5F9' }}>
                                    Friend Signs Up
                                </p>
                                <p className="text-xs" style={{ color: '#64748B' }}>
                                    Friend registers & verifies email + phone
                                </p>
                                <p className="text-xs mt-1" style={{ color: '#10B981' }}>
                                    You get ₹10 • Friend gets ₹10
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold"
                                style={{ backgroundColor: '#10B981', color: '#ffffff' }}>
                                3
                            </div>
                            <div>
                                <p className="text-sm font-medium" style={{ color: '#F1F5F9' }}>
                                    Friend Places First Order
                                </p>
                                <p className="text-xs" style={{ color: '#64748B' }}>
                                    When friend completes their first order
                                </p>
                                <p className="text-xs mt-1" style={{ color: '#10B981' }}>
                                    You get another ₹10!
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Referred Users List */}
                {referralData?.referrals?.length > 0 && (
                    <div>
                        <h3 className="text-sm font-semibold mb-3"
                            style={{ color: '#F1F5F9' }}>
                            Referred Friends
                        </h3>

                        <div className="space-y-2">
                            {referralData.referrals.map((referral, index) => (
                                <div key={index}
                                    className="p-3 rounded-xl flex items-center gap-3"
                                    style={{ backgroundColor: '#1A1D27',
                                             border: '1px solid #2E3148' }}>
                                    <div className="w-10 h-10 rounded-full flex items-center justify-center"
                                        style={{ backgroundColor: '#222536' }}>
                                        <span className="text-sm font-bold"
                                            style={{ color: '#64748B' }}>
                                            {referral.name?.[0]?.toUpperCase() || '?'}
                                        </span>
                                    </div>
                                    
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate"
                                            style={{ color: '#F1F5F9' }}>
                                            {referral.name || 'Unknown User'}
                                        </p>
                                        <p className="text-xs" style={{ color: '#64748B' }}>
                                            Joined {new Date(referral.joinedAt).toLocaleDateString('en-IN', {
                                                day: 'numeric',
                                                month: 'short'
                                            })}
                                        </p>
                                    </div>

                                    <div className="text-right">
                                        {referral.referralBonusCredited ? (
                                            <span className="text-xs px-2 py-1 rounded-full"
                                                style={{ backgroundColor: '#0D2B1F',
                                                         color: '#10B981' }}>
                                                ₹20 Earned
                                            </span>
                                        ) : referral.signupBonusCredited ? (
                                            <span className="text-xs px-2 py-1 rounded-full"
                                                style={{ backgroundColor: '#0D1B2B',
                                                         color: '#3B82F6' }}>
                                                ₹10 Earned
                                            </span>
                                        ) : (
                                            <span className="text-xs px-2 py-1 rounded-full"
                                                style={{ backgroundColor: '#222536',
                                                         color: '#64748B' }}>
                                                Pending
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Pending Bonus Note */}
                {referralData?.pendingBonus > 0 && (
                    <div className="p-3 rounded-xl flex items-center gap-2"
                        style={{ backgroundColor: '#0D2B1F',
                                 border: '1px solid #10B981' }}>
                        <Gift size={16} color="#10B981" />
                        <p className="text-sm" style={{ color: '#10B981' }}>
                            ₹{referralData.pendingBonus} pending — friends need to place their first order!
                        </p>
                    </div>
                )}

            </div>
        </div>
    )
}

export default Referral
