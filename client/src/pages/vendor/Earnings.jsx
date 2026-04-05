import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    ArrowLeft, IndianRupee, TrendingUp, Calendar,
    Download, Wallet, ChevronRight, BarChart3,
    Clock, CheckCircle, XCircle, Printer
} from 'lucide-react'
import api from '../../utils/axios.js'
import Loader from '../../components/common/Loader.jsx'

/**
 * Vendor Earnings Dashboard
 * 
 * API Endpoints:
 * - GET /api/earnings/dashboard - Get earnings stats
 * - GET /api/earnings/by-date?startDate&endDate - Date range earnings
 * - POST /api/earnings/payout - Request payout
 */

const Earnings = () => {
    const [earnings, setEarnings] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [activeTab, setActiveTab] = useState('overview')
    
    const navigate = useNavigate()

    useEffect(() => {
        fetchEarnings()
    }, [])

    const fetchEarnings = async () => {
        try {
            const res = await api.get('/earnings/dashboard')
            setEarnings(res.data.data)
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load earnings')
        } finally {
            setLoading(false)
        }
    }

    if (loading) return <Loader />

    const statsCards = [
        {
            label: "Today's Earnings",
            value: earnings?.today?.earnings || 0,
            orders: earnings?.today?.orders || 0,
            icon: IndianRupee,
            color: '#10B981'
        },
        {
            label: 'This Week',
            value: earnings?.thisWeek?.earnings || 0,
            orders: earnings?.thisWeek?.orders || 0,
            icon: TrendingUp,
            color: '#3B82F6'
        },
        {
            label: 'This Month',
            value: earnings?.thisMonth?.earnings || 0,
            orders: earnings?.thisMonth?.orders || 0,
            icon: Calendar,
            color: '#8B5CF6'
        },
        {
            label: 'All Time',
            value: earnings?.allTime?.earnings || 0,
            orders: earnings?.allTime?.orders || 0,
            icon: Wallet,
            color: '#F59E0B'
        }
    ]

    const orderStatusStats = [
        { label: 'Pending', value: earnings?.orderStats?.pending || 0, icon: Clock, color: '#F59E0B' },
        { label: 'Accepted', value: earnings?.orderStats?.accepted || 0, icon: CheckCircle, color: '#3B82F6' },
        { label: 'Printing', value: earnings?.orderStats?.printing || 0, icon: Printer, color: '#8B5CF6' },
        { label: 'Completed', value: earnings?.orderStats?.completed || 0, icon: CheckCircle, color: '#10B981' },
        { label: 'Rejected', value: earnings?.orderStats?.rejected || 0, icon: XCircle, color: '#EF4444' },
        { label: 'Cancelled', value: earnings?.orderStats?.cancelled || 0, icon: XCircle, color: '#64748B' }
    ]

    return (
        <div className="min-h-screen safe-area-pb" style={{ backgroundColor: '#0F172A' }}>
            {/* Header */}
            <header className="sticky top-0 z-10 px-4 py-4 safe-area-pt"
                style={{ 
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    backdropFilter: 'blur(12px)',
                    borderBottom: '1px solid rgba(51, 65, 85, 0.5)'
                }}>
                <div className="max-w-lg mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => navigate('/dashboard')}
                            className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors active:scale-95"
                            style={{ backgroundColor: 'rgba(30, 41, 59, 0.7)' }}>
                            <ArrowLeft size={20} color="#F1F5F9" />
                        </button>
                        <h1 className="text-lg font-bold" style={{ color: '#F1F5F9' }}>
                            Earnings
                        </h1>
                    </div>
                    <button
                        onClick={() => navigate('/earnings/payout')}
                        className="px-4 py-2 rounded-xl text-sm font-semibold transition-all active:scale-95"
                        style={{ 
                            backgroundColor: '#10B981',
                            color: '#ffffff'
                        }}>
                        Withdraw
                    </button>
                </div>
            </header>

            <main className="max-w-lg mx-auto px-4 py-4 space-y-4">
                {/* Error */}
                {error && (
                    <div className="p-4 rounded-xl animate-fade-in"
                        style={{ 
                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.3)'
                        }}>
                        <p className="text-sm" style={{ color: '#EF4444' }}>{error}</p>
                    </div>
                )}

                {/* Total Balance Card */}
                <div className="glass-card p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10"
                        style={{ 
                            background: 'radial-gradient(circle, #10B981 0%, transparent 70%)',
                            transform: 'translate(30%, -30%)'
                        }} />
                    
                    <div className="relative">
                        <p className="text-sm" style={{ color: '#94A3B8' }}>Available Balance</p>
                        <p className="text-4xl font-bold mt-1" style={{ color: '#F1F5F9' }}>
                            ₹{earnings?.allTime?.earnings?.toFixed(2) || '0.00'}
                        </p>
                        <p className="text-xs mt-2" style={{ color: '#64748B' }}>
                            Total earned from {earnings?.allTime?.orders || 0} completed orders
                        </p>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3">
                    {statsCards.map((stat, index) => {
                        const Icon = stat.icon
                        return (
                            <div key={index} className="glass-card p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <div 
                                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                                        style={{ backgroundColor: `${stat.color}20` }}>
                                        <Icon size={16} color={stat.color} />
                                    </div>
                                    <span className="text-xs" style={{ color: '#64748B' }}>
                                        {stat.label}
                                    </span>
                                </div>
                                <p className="text-xl font-bold" style={{ color: stat.color }}>
                                    ₹{stat.value}
                                </p>
                                <p className="text-xs" style={{ color: '#64748B' }}>
                                    {stat.orders} orders
                                </p>
                            </div>
                        )
                    })}
                </div>

                {/* Order Status Stats */}
                <div className="glass-card p-4">
                    <h3 className="text-sm font-semibold mb-4" style={{ color: '#F1F5F9' }}>
                        Order Statistics
                    </h3>
                    <div className="grid grid-cols-3 gap-3">
                        {orderStatusStats.map((stat, index) => {
                            const Icon = stat.icon
                            return (
                                <div key={index} className="text-center p-3 rounded-xl"
                                    style={{ backgroundColor: 'rgba(30, 41, 59, 0.5)' }}>
                                    <Icon size={18} color={stat.color} className="mx-auto mb-2" />
                                    <p className="text-lg font-bold" style={{ color: '#F1F5F9' }}>
                                        {stat.value}
                                    </p>
                                    <p className="text-xs" style={{ color: '#64748B' }}>
                                        {stat.label}
                                    </p>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Recent Orders */}
                <div className="glass-card p-4">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold" style={{ color: '#F1F5F9' }}>
                            Recent Completed Orders
                        </h3>
                        <button 
                            onClick={() => navigate('/dashboard')}
                            className="text-xs flex items-center gap-1"
                            style={{ color: '#10B981' }}>
                            View All <ChevronRight size={14} />
                        </button>
                    </div>
                    
                    {earnings?.recentOrders?.length === 0 ? (
                        <p className="text-center py-4 text-sm" style={{ color: '#64748B' }}>
                            No completed orders yet
                        </p>
                    ) : (
                        <div className="space-y-2">
                            {earnings?.recentOrders?.map((order, index) => (
                                <div key={index} 
                                    className="flex items-center justify-between p-3 rounded-xl"
                                    style={{ backgroundColor: 'rgba(30, 41, 59, 0.5)' }}>
                                    <div className="flex items-center gap-3">
                                        <div 
                                            className="w-10 h-10 rounded-lg flex items-center justify-center"
                                            style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)' }}>
                                            <IndianRupee size={18} color="#10B981" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium font-mono" style={{ color: '#F1F5F9' }}>
                                                #{order.pickupToken}
                                            </p>
                                            <p className="text-xs" style={{ color: '#64748B' }}>
                                                {new Date(order.updatedAt).toLocaleDateString('en-IN', {
                                                    day: 'numeric',
                                                    month: 'short'
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                    <p className="text-lg font-bold" style={{ color: '#10B981' }}>
                                        +₹{order.totalAmount}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Daily Breakdown Chart */}
                {earnings?.dailyBreakdown?.length > 0 && (
                    <div className="glass-card p-4">
                        <h3 className="text-sm font-semibold mb-4" style={{ color: '#F1F5F9' }}>
                            Last 7 Days
                        </h3>
                        <div className="flex items-end gap-2 h-32">
                            {earnings.dailyBreakdown.map((day, index) => {
                                const maxEarnings = Math.max(...earnings.dailyBreakdown.map(d => d.earnings))
                                const height = maxEarnings > 0 ? (day.earnings / maxEarnings) * 100 : 0
                                
                                return (
                                    <div key={index} className="flex-1 flex flex-col items-center gap-1">
                                        <div
                                            className="w-full rounded-t transition-all hover:opacity-80"
                                            style={{
                                                height: `${Math.max(height, 4)}%`,
                                                backgroundColor: '#10B981',
                                                minHeight: '4px'
                                            }}
                                            title={`₹${day.earnings} on ${day._id}`}
                                        />
                                        <span className="text-xs" style={{ color: '#64748B' }}>
                                            {new Date(day._id).toLocaleDateString('en-IN', { weekday: 'narrow' })}
                                        </span>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}
            </main>
        </div>
    )
}

export default Earnings
