import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    Package, Clock, Printer, CheckCircle, Timer,
    XCircle, Power, Settings, LogOut, TrendingUp,
    ChevronLeft, ChevronRight, AlertCircle, MapPin,
    Phone, FileText
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext.jsx'
import StatusBadge from '../../components/common/StatusBadge.jsx'
import Loader from '../../components/common/Loader.jsx'
import { DashboardOrderSkeleton, StatsSkeleton } from '../../components/common/Skeleton.jsx'
import usePolling from '../../hooks/usePolling.js'
import api from '../../utils/axios.js'

const ORDERS_PER_PAGE = 20

const NEXT_STATUS = {
    pending:  'accepted',
    accepted: 'printing',
    printing: 'completed',
}

const NEXT_STATUS_LABEL = {
    pending:  'Accept Order',
    accepted: 'Start Printing',
    printing: 'Mark Ready',
}

// SLA timeout in milliseconds (2 minutes)
const SLA_TIMEOUT_MS = 2 * 60 * 1000

const Dashboard = () => {
    const [orders, setOrders] = useState([])
    const [vendor, setVendor] = useState(null)
    const [stats, setStats] = useState(null)
    const [loading, setLoading] = useState(true)
    const [togglingStatus, setTogglingStatus] = useState(false)
    const [updatingOrder, setUpdatingOrder] = useState(null)
    const [activeTab, setActiveTab] = useState('active')
    const [error, setError] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [currentTime, setCurrentTime] = useState(Date.now())

    const { user, logout } = useAuth()
    const navigate = useNavigate()

    // Update current time every second for SLA timers
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(Date.now()), 1000)
        return () => clearInterval(timer)
    }, [])

    const fetchDashboard = async (page = currentPage) => {
        try {
            const [vendorRes, ordersRes, statsRes] = await Promise.all([
                api.get('/vendor/profile/me'),
                api.get('/orders/vendor-orders', {
                    params: { page, limit: ORDERS_PER_PAGE }
                }),
                api.get('/vendor/dashboard-stats').catch(() => ({ data: { data: null } }))
            ])
            setVendor(vendorRes.data.data)
            setOrders(ordersRes.data.data || [])
            setTotalPages(ordersRes.data.pagination?.totalPages || 1)
            setStats(statsRes.data.data)
        } catch(err) {
            if(err.response?.status === 400){
                setOrders([])
            } else {
                setError('Could not load dashboard')
            }
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchDashboard()
    }, [])

    // Auto refresh every 20 seconds
    usePolling(() => fetchDashboard(currentPage), 20000, !loading)

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage)
            setLoading(true)
        }
    }

    // Calculate SLA remaining time
    const getSLARemaining = (order) => {
        if (order.status !== 'pending' || !order.createdAt) return null
        const createdTime = new Date(order.createdAt).getTime()
        const elapsed = currentTime - createdTime
        const remaining = SLA_TIMEOUT_MS - elapsed
        return Math.max(0, remaining)
    }

    // Format SLA time
    const formatSLATime = (ms) => {
        const minutes = Math.floor(ms / 60000)
        const seconds = Math.floor((ms % 60000) / 1000)
        return `${minutes}:${seconds.toString().padStart(2, '0')}`
    }

    // Show skeleton loaders during initial load
    if (loading) {
        return (
            <div className="min-h-screen safe-area-pb" style={{ backgroundColor: '#0F172A' }}>
                {/* Header */}
                <header className="sticky top-0 z-10 px-4 py-4 safe-area-pt"
                    style={{ 
                        backgroundColor: 'rgba(15, 23, 42, 0.95)',
                        backdropFilter: 'blur(12px)',
                        borderBottom: '1px solid rgba(51, 65, 85, 0.5)'
                    }}>
                    <div className="max-w-2xl mx-auto">
                        <div className="w-32 h-6 rounded mb-1 shimmer" />
                        <div className="w-48 h-4 rounded shimmer" />
                    </div>
                </header>

                <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
                    {/* Shop Status Skeleton */}
                    <div className="glass-card p-4 flex items-center justify-between">
                        <div>
                            <div className="w-24 h-5 rounded mb-1 shimmer" />
                            <div className="w-32 h-3 rounded shimmer" />
                        </div>
                        <div className="w-10 h-6 rounded shimmer" />
                    </div>

                    {/* Stats Skeleton */}
                    <StatsSkeleton />

                    {/* Tabs Skeleton */}
                    <div className="flex gap-2">
                        <div className="flex-1 h-10 rounded-xl shimmer" />
                        <div className="flex-1 h-10 rounded-xl shimmer" />
                    </div>

                    {/* Orders Skeleton */}
                    <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                            <DashboardOrderSkeleton key={i} />
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    const toggleShopStatus = async () => {
        setTogglingStatus(true)
        try {
            await api.patch('/vendor/toggle-status')
            setVendor(prev => ({ ...prev, isOpen: !prev.isOpen }))
        } catch(err) {
            setError('Could not toggle shop status')
        } finally {
            setTogglingStatus(false)
        }
    }

    // Helper to clean Cloudinary URL
    const getCleanUrl = (url) => {
        if (!url) return '#'
        return url
            .replace('/fl_inline/', '/')
            .replace('fl_inline,', '')
            .replace(',fl_inline', '')
    }

    // Fetch PDF with auth and open print dialog
    const openPrintDialog = async (order) => {
        try {
            const cleanUrl = getCleanUrl(order.fileUrl)
            
            // Fetch the file with auth token
            const response = await api.get(cleanUrl, {
                responseType: 'blob'
            })
            
            // Create blob URL
            const blob = new Blob([response.data], { type: 'application/pdf' })
            const blobUrl = URL.createObjectURL(blob)
            
            // Open in new window
            const printWindow = window.open(blobUrl, '_blank')
            
            if (printWindow) {
                // Wait for PDF to load then print
                printWindow.addEventListener('load', () => {
                    setTimeout(() => {
                        printWindow.print()
                        // Clean up after printing
                        setTimeout(() => {
                            URL.revokeObjectURL(blobUrl)
                        }, 1000)
                    }, 1000)
                })
                
                // Fallback timeout
                setTimeout(() => {
                    printWindow.print()
                    URL.revokeObjectURL(blobUrl)
                }, 2000)
            }
        } catch (err) {
            console.error('Failed to open print dialog:', err)
            setError('Could not open PDF for printing')
        }
    }

    const updateStatus = async (orderId, status) => {
        setUpdatingOrder(orderId)
        try {
            await api.patch(`/orders/${orderId}/status`, { status })
            setOrders(prev => prev.map(o =>
                o._id === orderId ? { ...o, status } : o
            ))
        } catch(err) {
            setError('Could not update order status')
        } finally {
            setUpdatingOrder(null)
        }
    }

    // Special handler for "Mark Printing" - updates status AND opens print dialog
    const handleMarkPrinting = async (order) => {
        setUpdatingOrder(order._id)
        try {
            // First update the status
            await api.patch(`/orders/${order._id}/status`, { status: 'printing' })
            
            // Update local state
            setOrders(prev => prev.map(o =>
                o._id === order._id ? { ...o, status: 'printing' } : o
            ))
            
            // Then open print dialog
            await openPrintDialog(order)
            
        } catch(err) {
            setError('Could not update order status or open PDF')
        } finally {
            setUpdatingOrder(null)
        }
    }

    const rejectOrder = async (orderId) => {
        setUpdatingOrder(orderId)
        try {
            await api.patch(`/orders/${orderId}/status`, { status: 'rejected' })
            setOrders(prev => prev.map(o =>
                o._id === orderId ? { ...o, status: 'rejected' } : o
            ))
        } catch(err) {
            setError('Could not reject order')
        } finally {
            setUpdatingOrder(null)
        }
    }

    const activeOrders = orders.filter(o =>
        ['pending', 'accepted', 'printing'].includes(o.status)
    )
    const completedOrders = orders.filter(o =>
        ['completed', 'rejected'].includes(o.status)
    )
    const displayOrders = activeTab === 'active'
        ? activeOrders : completedOrders

    // Revenue calculation
    const totalRevenue = orders
        .filter(o => o.status === 'completed')
        .reduce((sum, o) => sum + o.totalAmount, 0)



    return (
        <div className="min-h-screen safe-area-pb" style={{ backgroundColor: '#0F172A' }}>
            {/* Header */}
            <header className="sticky top-0 z-10 px-4 py-4 safe-area-pt"
                style={{ 
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    backdropFilter: 'blur(12px)',
                    borderBottom: '1px solid rgba(51, 65, 85, 0.5)'
                }}>
                <div className="max-w-2xl mx-auto flex items-center justify-between">
                    <div>
                        <h1 className="text-lg font-bold" style={{ color: '#F1F5F9' }}>
                            Active Orders
                        </h1>
                        <p className="text-xs" style={{ color: '#64748B' }}>
                            {vendor?.shopName || user?.fullName}
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => navigate('/manage-shop')}
                            className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors active:scale-95"
                            style={{ backgroundColor: 'rgba(30, 41, 59, 0.7)' }}>
                            <Settings size={18} color="#94A3B8" />
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-2xl mx-auto px-4 py-4 space-y-4">
                {/* Error */}
                {error && (
                    <div className="p-4 rounded-xl flex items-center gap-3 animate-fade-in"
                        style={{ 
                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.3)'
                        }}>
                        <AlertCircle size={20} color="#EF4444" />
                        <p className="text-sm" style={{ color: '#EF4444' }}>{error}</p>
                    </div>
                )}

                {/* Shop Status Toggle */}
                {vendor && (
                    <div className="glass-card p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div 
                                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                                    vendor.isOpen ? 'animate-pulse-glow' : ''
                                }`}
                                style={{ 
                                    backgroundColor: vendor.isOpen 
                                        ? 'rgba(16, 185, 129, 0.15)' 
                                        : 'rgba(239, 68, 68, 0.1)'
                                }}
                            >
                                <Power size={20} color={vendor.isOpen ? '#10B981' : '#EF4444'} />
                            </div>
                            <div>
                                <p className="text-sm font-semibold" style={{ color: '#F1F5F9' }}>
                                    Shop {vendor.isOpen ? 'Open' : 'Closed'}
                                </p>
                                <p className="text-xs" style={{ color: vendor.isOpen ? '#10B981' : '#EF4444' }}>
                                    {vendor.isOpen ? 'Receiving orders' : 'Hidden from customers'}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={toggleShopStatus}
                            disabled={togglingStatus}
                            className={`w-14 h-8 rounded-full relative transition-all duration-300 ${
                                togglingStatus ? 'opacity-50' : ''
                            }`}
                            style={{ 
                                backgroundColor: vendor.isOpen ? '#10B981' : '#334155'
                            }}
                        >
                            <div 
                                className="absolute top-1 w-6 h-6 rounded-full bg-white transition-all duration-300"
                                style={{ left: vendor.isOpen ? 'calc(100% - 28px)' : '4px' }}
                            />
                        </button>
                    </div>
                )}

                {/* Stats Bar - Horizontal Scroll */}
                <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
                    {[
                        {
                            label: "Today's Revenue",
                            value: `₹${stats?.todayRevenue || 0}`,
                            color: '#10B981',
                            icon: TrendingUp
                        },
                        {
                            label: 'Pending',
                            value: orders.filter(o => o.status === 'pending').length,
                            color: '#F59E0B',
                            icon: Clock
                        },
                        {
                            label: 'Printing',
                            value: orders.filter(o => o.status === 'printing').length,
                            color: '#3B82F6',
                            icon: Printer
                        },
                        {
                            label: 'Avg Ready Time',
                            value: stats?.avgReadyTime || '10m',
                            color: '#8B5CF6',
                            icon: Timer
                        },
                    ].map((stat, i) => {
                        const Icon = stat.icon
                        return (
                            <div key={i}
                                className="flex-shrink-0 p-3 rounded-xl min-w-[140px]"
                                style={{ 
                                    backgroundColor: 'rgba(30, 41, 59, 0.7)',
                                    border: '1px solid rgba(51, 65, 85, 0.5)'
                                }}>
                                <div className="flex items-center gap-2 mb-2">
                                    <div 
                                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                                        style={{ backgroundColor: `${stat.color}20` }}
                                    >
                                        <Icon size={16} color={stat.color} />
                                    </div>
                                </div>
                                <p className="text-lg font-bold" style={{ color: stat.color }}>
                                    {stat.value}
                                </p>
                                <p className="text-xs" style={{ color: '#64748B' }}>
                                    {stat.label}
                                </p>
                            </div>
                        )
                    })}
                </div>

                {/* Tabs */}
                <div className="flex gap-2">
                    {[
                        { key: 'active',  label: `Active (${activeOrders.length})` },
                        { key: 'history', label: `History (${completedOrders.length})` }
                    ].map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all duration-200"
                            style={{
                                backgroundColor: activeTab === tab.key
                                    ? '#10B981' : 'rgba(30, 41, 59, 0.7)',
                                color: activeTab === tab.key
                                    ? '#ffffff' : '#94A3B8',
                                border: '1px solid',
                                borderColor: activeTab === tab.key
                                    ? '#10B981' : 'rgba(51, 65, 85, 0.5)'
                            }}>
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Orders List */}
                {displayOrders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16">
                        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                            style={{ backgroundColor: 'rgba(100, 116, 139, 0.1)' }}>
                            <Package size={28} color="#64748B" />
                        </div>
                        <p className="text-base font-semibold" style={{ color: '#F1F5F9' }}>
                            {activeTab === 'active' ? 'No active orders' : 'No order history'}
                        </p>
                        <p className="text-sm mt-1" style={{ color: '#64748B' }}>
                            {activeTab === 'active' 
                                ? 'New orders will appear here' 
                                : 'Completed orders will appear here'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {displayOrders.map(order => {
                            const nextStatus = NEXT_STATUS[order.status]
                            const isUpdating = updatingOrder === order._id
                            const slaRemaining = getSLARemaining(order)
                            const isSLAActive = slaRemaining !== null && slaRemaining > 0
                            const isSLAExpired = slaRemaining !== null && slaRemaining === 0

                            return (
                                <div key={order._id} className="glass-card p-4 animate-fade-in">
                                    {/* Header - Token & Status */}
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <FileText size={16} color="#64748B" />
                                            <span className="text-sm font-bold font-mono" style={{ color: '#10B981' }}>
                                                #{order.pickupToken}
                                            </span>
                                        </div>
                                        
                                        <div className="flex items-center gap-2">
                                            {/* SLA Timer */}
                                            {isSLAActive && (
                                                <span 
                                                    className="text-xs px-2 py-1 rounded-full font-medium animate-pulse"
                                                    style={{ 
                                                        backgroundColor: 'rgba(239, 68, 68, 0.15)',
                                                        color: '#EF4444'
                                                    }}
                                                >
                                                    {formatSLATime(slaRemaining)} to accept
                                                </span>
                                            )}
                                            {isSLAExpired && (
                                                <span 
                                                    className="text-xs px-2 py-1 rounded-full font-medium"
                                                    style={{ 
                                                        backgroundColor: 'rgba(239, 68, 68, 0.15)',
                                                        color: '#EF4444'
                                                    }}
                                                >
                                                    SLA Expired
                                                </span>
                                            )}
                                            <StatusBadge status={order.status} size="sm" />
                                        </div>
                                    </div>

                                    {/* File Name */}
                                    <p className="text-sm font-medium truncate mb-3" style={{ color: '#F1F5F9' }}>
                                        {order.fileName}
                                    </p>

                                    {/* Document Info */}
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="flex items-center gap-1.5">
                                            <Printer size={12} color="#64748B" />
                                            <span className="text-xs" style={{ color: '#94A3B8' }}>
                                                {order.pageCount} pgs
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <span 
                                                className="w-2 h-2 rounded-full"
                                                style={{ 
                                                    backgroundColor: order.printConfig?.printType?.includes('color') 
                                                        ? '#F59E0B' : '#64748B'
                                                }}
                                            />
                                            <span className="text-xs" style={{ color: '#94A3B8' }}>
                                                {order.printConfig?.printType?.includes('color') ? 'Color' : 'B&W'}
                                            </span>
                                        </div>
                                        <span className="ml-auto text-base font-bold" style={{ color: '#10B981' }}>
                                            ₹{order.totalAmount}
                                        </span>
                                    </div>

                                    {/* Action Buttons */}
                                    {nextStatus && (
                                        <div className="flex gap-3">
                                            {order.status === 'pending' && (
                                                <button
                                                    onClick={() => rejectOrder(order._id)}
                                                    disabled={isUpdating}
                                                    className="px-4 py-3 rounded-xl text-sm font-medium transition-all active:scale-95 disabled:opacity-50"
                                                    style={{
                                                        backgroundColor: 'transparent',
                                                        color: '#EF4444',
                                                    }}>
                                                    Reject
                                                </button>
                                            )}
                                            <button
                                                onClick={() => 
                                                    order.status === 'accepted'
                                                        ? handleMarkPrinting(order)
                                                        : updateStatus(order._id, nextStatus)
                                                }
                                                disabled={isUpdating}
                                                className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all active:scale-95 disabled:opacity-50"
                                                style={{
                                                    backgroundColor: '#10B981',
                                                    color: '#ffffff',
                                                    boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)'
                                                }}>
                                                {isUpdating ? (
                                                    <span className="flex items-center justify-center gap-2">
                                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                        Processing...
                                                    </span>
                                                ) : (
                                                    NEXT_STATUS_LABEL[order.status]
                                                )}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-4 mt-6 pt-4"
                        style={{ borderTop: '1px solid rgba(51, 65, 85, 0.5)' }}>
                        <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="w-10 h-10 rounded-xl flex items-center justify-center disabled:opacity-40 transition-all active:scale-95"
                            style={{ 
                                backgroundColor: 'rgba(30, 41, 59, 0.7)',
                                border: '1px solid rgba(51, 65, 85, 0.5)'
                            }}>
                            <ChevronLeft size={20} color="#F1F5F9" />
                        </button>
                        
                        <span className="text-sm font-medium" style={{ color: '#94A3B8' }}>
                            Page {currentPage} of {totalPages}
                        </span>
                        
                        <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="w-10 h-10 rounded-xl flex items-center justify-center disabled:opacity-40 transition-all active:scale-95"
                            style={{ 
                                backgroundColor: 'rgba(30, 41, 59, 0.7)',
                                border: '1px solid rgba(51, 65, 85, 0.5)'
                            }}>
                            <ChevronRight size={20} color="#F1F5F9" />
                        </button>
                    </div>
                )}
            </main>
        </div>
    )
}

export default Dashboard