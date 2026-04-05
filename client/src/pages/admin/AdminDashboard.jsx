import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    LayoutDashboard, Users, Store, ShoppingBag, AlertCircle,
    TrendingUp, DollarSign, Package, Bell, ChevronRight,
    LogOut, Search, Filter
} from 'lucide-react'
import api from '../../utils/axios.js'
import Loader from '../../components/common/Loader.jsx'

// Simple chart component using CSS
const BarChart = ({ data, maxValue }) => {
    return (
        <div className="flex items-end gap-1 h-32 mt-4">
            {data.map((item, index) => (
                <div key={index} className="flex-1 flex flex-col items-center gap-1">
                    <div
                        className="w-full rounded-t transition-all hover:opacity-80"
                        style={{
                            height: `${(item.count / maxValue) * 100}%`,
                            backgroundColor: '#10B981',
                            minHeight: '4px'
                        }}
                        title={`${item._id}: ${item.count} orders`}
                    />
                    <span className="text-xs truncate w-full text-center" style={{ color: '#64748B' }}>
                        {item._id.slice(5)}
                    </span>
                </div>
            ))}
        </div>
    )
}

// Pie chart using conic gradient
const PieChart = ({ data }) => {
    const total = Object.values(data).reduce((a, b) => a + b, 0)
    const colors = ['#10B981', '#3B82F6', '#EAB308', '#EF4444', '#8B5CF6']
    
    let currentAngle = 0
    const segments = Object.entries(data).map(([key, value], index) => {
        const angle = (value / total) * 360
        const segment = {
            key,
            value,
            angle,
            startAngle: currentAngle,
            color: colors[index % colors.length]
        }
        currentAngle += angle
        return segment
    })

    const gradient = segments
        .map(s => `${s.color} ${s.startAngle}deg ${s.startAngle + s.angle}deg`)
        .join(', ')

    return (
        <div className="flex items-center gap-6">
            <div
                className="w-32 h-32 rounded-full"
                style={{
                    background: `conic-gradient(${gradient})`
                }}
            />
            <div className="space-y-2">
                {segments.map(s => (
                    <div key={s.key} className="flex items-center gap-2">
                        <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: s.color }}
                        />
                        <span className="text-sm capitalize" style={{ color: '#94A3B8' }}>
                            {s.key}: {s.value}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    )
}

const AdminDashboard = () => {
    const [stats, setStats] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [activeTab, setActiveTab] = useState('overview')
    const navigate = useNavigate()

    useEffect(() => {
        fetchStats()
    }, [])

    const fetchStats = async () => {
        try {
            const res = await api.get('/admin/dashboard-stats')
            setStats(res.data.data)
        } catch (err) {
            setError('Failed to load dashboard stats')
        } finally {
            setLoading(false)
        }
    }

    if (loading) return <Loader />

    const navItems = [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard },
        { id: 'users', label: 'Users', icon: Users },
        { id: 'vendors', label: 'Vendors', icon: Store },
        { id: 'orders', label: 'Orders', icon: ShoppingBag },
        { id: 'disputes', label: 'Disputes', icon: AlertCircle },
        { id: 'notifications', label: 'Notifications', icon: Bell },
    ]

    return (
        <div className="min-h-screen flex" style={{ backgroundColor: '#0F1117' }}>
            {/* Sidebar */}
            <div className="w-64 fixed h-full" style={{ backgroundColor: '#1A1D27', borderRight: '1px solid #2E3148' }}>
                <div className="p-4">
                    <h1 className="text-xl font-bold" style={{ color: '#10B981' }}>
                        XConnect Admin
                    </h1>
                </div>

                <nav className="mt-4 px-2">
                    {navItems.map(item => {
                        const Icon = item.icon
                        return (
                            <button
                                key={item.id}
                                onClick={() => {
                                    setActiveTab(item.id)
                                    if (item.id === 'notifications') {
                                        navigate('/admin/notify')
                                    }
                                }}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                                    activeTab === item.id ? 'bg-emerald-500/10 text-emerald-500' : 'text-slate-400 hover:text-slate-200'
                                }`}
                            >
                                <Icon size={18} />
                                {item.label}
                            </button>
                        )
                    })}
                </nav>

                <div className="absolute bottom-4 left-0 right-0 px-4">
                    <button
                        onClick={() => navigate('/login')}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-400 hover:text-slate-200"
                    >
                        <LogOut size={18} />
                        Logout
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 ml-64 p-6">
                {error && (
                    <div className="mb-4 p-4 rounded-xl" style={{ backgroundColor: '#2D1515', border: '1px solid #EF4444', color: '#EF4444' }}>
                        {error}
                    </div>
                )}

                {/* Stats Cards */}
                <div className="grid grid-cols-4 gap-4 mb-6">
                    {[
                        { label: 'Total Users', value: stats?.totals?.users || 0, icon: Users, color: '#3B82F6' },
                        { label: 'Total Vendors', value: stats?.totals?.vendors || 0, icon: Store, color: '#10B981' },
                        { label: 'Total Orders', value: stats?.totals?.orders || 0, icon: ShoppingBag, color: '#EAB308' },
                        { label: 'Active Disputes', value: stats?.totals?.disputes || 0, icon: AlertCircle, color: '#EF4444' },
                    ].map((stat, index) => {
                        const Icon = stat.icon
                        return (
                            <div
                                key={index}
                                className="p-4 rounded-2xl"
                                style={{ backgroundColor: '#1A1D27', border: '1px solid #2E3148' }}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm" style={{ color: '#64748B' }}>
                                        {stat.label}
                                    </span>
                                    <Icon size={18} color={stat.color} />
                                </div>
                                <p className="text-2xl font-bold" style={{ color: '#F1F5F9' }}>
                                    {stat.value.toLocaleString()}
                                </p>
                            </div>
                        )
                    })}
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-2 gap-6 mb-6">
                    {/* Daily Orders Chart */}
                    <div
                        className="p-6 rounded-2xl"
                        style={{ backgroundColor: '#1A1D27', border: '1px solid #2E3148' }}
                    >
                        <h3 className="text-lg font-semibold mb-4" style={{ color: '#F1F5F9' }}>
                            Daily Orders (Last 30 Days)
                        </h3>
                        {stats?.dailyOrders?.length > 0 ? (
                            <BarChart
                                data={stats.dailyOrders}
                                maxValue={Math.max(...stats.dailyOrders.map(d => d.count))}
                            />
                        ) : (
                            <p className="text-center py-8" style={{ color: '#64748B' }}>
                                No data available
                            </p>
                        )}
                    </div>

                    {/* Plan Distribution */}
                    <div
                        className="p-6 rounded-2xl"
                        style={{ backgroundColor: '#1A1D27', border: '1px solid #2E3148' }}
                    >
                        <h3 className="text-lg font-semibold mb-4" style={{ color: '#F1F5F9' }}>
                            Plan Distribution
                        </h3>
                        {stats?.planDistribution && Object.keys(stats.planDistribution).length > 0 ? (
                            <PieChart data={stats.planDistribution} />
                        ) : (
                            <p className="text-center py-8" style={{ color: '#64748B' }}>
                                No data available
                            </p>
                        )}
                    </div>
                </div>

                {/* Recent Disputes */}
                <div
                    className="rounded-2xl overflow-hidden"
                    style={{ backgroundColor: '#1A1D27', border: '1px solid #2E3148' }}
                >
                    <div className="p-4 flex items-center justify-between" style={{ borderBottom: '1px solid #2E3148' }}>
                        <h3 className="text-lg font-semibold" style={{ color: '#F1F5F9' }}>
                            Recent Disputes
                        </h3>
                        <button
                            onClick={() => navigate('/admin/disputes')}
                            className="text-sm flex items-center gap-1"
                            style={{ color: '#10B981' }}
                        >
                            View All <ChevronRight size={16} />
                        </button>
                    </div>

                    <div className="divide-y" style={{ borderColor: '#2E3148' }}>
                        {stats?.recentDisputes?.length > 0 ? (
                            stats.recentDisputes.map(dispute => (
                                <div key={dispute._id} className="p-4 flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium" style={{ color: '#F1F5F9' }}>
                                            Order #{dispute.orderId?.pickupToken}
                                        </p>
                                        <p className="text-xs" style={{ color: '#64748B' }}>
                                            {dispute.customerId?.fullName} • {dispute.reason}
                                        </p>
                                    </div>
                                    <span
                                        className="px-2 py-1 rounded-full text-xs"
                                        style={{
                                            backgroundColor: dispute.status === 'open' ? '#2D2000' : '#0D2B1F',
                                            color: dispute.status === 'open' ? '#EAB308' : '#10B981'
                                        }}
                                    >
                                        {dispute.status}
                                    </span>
                                </div>
                            ))
                        ) : (
                            <p className="p-4 text-center text-sm" style={{ color: '#64748B' }}>
                                No recent disputes
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default AdminDashboard
