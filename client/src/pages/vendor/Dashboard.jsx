import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    Package, Clock, Printer, CheckCircle,
    XCircle, ToggleLeft, ToggleRight,
    Settings, LogOut, TrendingUp,
    ChevronLeft, ChevronRight
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
    accepted: 'Mark Printing',
    printing: 'Mark Completed',
}

const Dashboard = () => {
    const [orders, setOrders] = useState([])
    const [vendor, setVendor] = useState(null)
    const [loading, setLoading] = useState(true)
    const [togglingStatus, setTogglingStatus] = useState(false)
    const [updatingOrder, setUpdatingOrder] = useState(null)
    const [activeTab, setActiveTab] = useState('active')
    const [error, setError] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)

    const { user, logout } = useAuth()
    const navigate = useNavigate()

    const fetchDashboard = async (page = currentPage) => {
        try {
            const [vendorRes, ordersRes] = await Promise.all([
                api.get('/vendor/profile/me'),
                api.get('/orders/vendor-orders', {
                    params: { page, limit: ORDERS_PER_PAGE }
                })
            ])
            setVendor(vendorRes.data.data)
            setOrders(ordersRes.data.data || [])
            setTotalPages(ordersRes.data.pagination?.totalPages || 1)
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

    // Show skeleton loaders during initial load
    if (loading) {
        return (
            <div className="min-h-screen safe-area-pb"
                style={{ backgroundColor: '#0F1117' }}>
                {/* Header */}
                <div className="sticky top-0 z-10 px-4 py-4"
                    style={{ backgroundColor: '#0F1117',
                             borderBottom: '1px solid #2E3148' }}>
                    <div className="max-w-2xl mx-auto">
                        <div className="w-32 h-6 rounded mb-1"
                            style={{ backgroundColor: '#2E3148' }} />
                        <div className="w-48 h-4 rounded"
                            style={{ backgroundColor: '#2E3148' }} />
                    </div>
                </div>

                <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
                    {/* Shop Status Skeleton */}
                    <div className="p-4 rounded-2xl flex items-center justify-between"
                        style={{ backgroundColor: '#1A1D27', border: '1px solid #2E3148' }}>
                        <div>
                            <div className="w-24 h-5 rounded mb-1"
                                style={{ backgroundColor: '#2E3148' }} />
                            <div className="w-32 h-3 rounded"
                                style={{ backgroundColor: '#2E3148' }} />
                        </div>
                        <div className="w-10 h-6 rounded"
                            style={{ backgroundColor: '#2E3148' }} />
                    </div>

                    {/* Stats Skeleton */}
                    <StatsSkeleton />

                    {/* Tabs Skeleton */}
                    <div className="flex gap-2">
                        <div className="flex-1 h-10 rounded-xl"
                            style={{ backgroundColor: '#2E3148' }} />
                        <div className="flex-1 h-10 rounded-xl"
                            style={{ backgroundColor: '#2E3148' }} />
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
        <div className="min-h-screen safe-area-pb"
            style={{ backgroundColor: '#0F1117' }}>

            {/* Header */}
            <div className="sticky top-0 z-10 px-4 py-4"
                style={{ backgroundColor: '#0F1117',
                         borderBottom: '1px solid #2E3148' }}>
                <div className="max-w-2xl mx-auto flex items-center justify-between">
                    <div>
                        <h1 className="text-base font-bold"
                            style={{ color: '#F1F5F9' }}>
                            Dashboard
                        </h1>
                        <p className="text-xs"
                            style={{ color: '#64748B' }}>
                            {vendor?.shopName || user?.fullName}
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => navigate('/manage-shop')}
                            className="w-9 h-9 rounded-xl flex items-center 
                                       justify-center"
                            style={{ backgroundColor: '#1A1D27',
                                     border: '1px solid #2E3148' }}>
                            <Settings size={16} color="#94A3B8" />
                        </button>
                        <button
                            onClick={async () => {
                                await logout()
                                navigate('/login')
                            }}
                            className="w-9 h-9 rounded-xl flex items-center 
                                       justify-center"
                            style={{ backgroundColor: '#1A1D27',
                                     border: '1px solid #2E3148' }}>
                            <LogOut size={16} color="#94A3B8" />
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">

                {/* Error */}
                {error && (
                    <div className="px-4 py-3 rounded-xl text-sm"
                        style={{ backgroundColor: '#2D1515',
                                 color: '#EF4444',
                                 border: '1px solid #EF4444' }}>
                        {error}
                    </div>
                )}

                {/* Shop Status Toggle */}
                {vendor && (
                    <div className="p-4 rounded-2xl flex items-center justify-between"
                        style={{ backgroundColor: '#1A1D27',
                                 border: '1px solid #2E3148' }}>
                        <div>
                            <p className="text-sm font-semibold"
                                style={{ color: '#F1F5F9' }}>
                                Shop Status
                            </p>
                            <p className="text-xs mt-0.5"
                                style={{ color: vendor.isOpen
                                    ? '#10B981' : '#EF4444' }}>
                                {vendor.isOpen
                                    ? 'Visible to customers'
                                    : 'Hidden from customers'}
                            </p>
                        </div>
                        <button
                            onClick={toggleShopStatus}
                            disabled={togglingStatus}>
                            {vendor.isOpen
                                ? <ToggleRight size={40} color="#10B981" />
                                : <ToggleLeft size={40} color="#64748B" />
                            }
                        </button>
                    </div>
                )}

                {/* Stats Row */}
                <div className="grid grid-cols-4 gap-2">
                    {[
                        {
                            label: 'Active',
                            value: activeOrders.length,
                            color: '#3B82F6',
                            icon: Clock
                        },
                        {
                            label: 'Completed',
                            value: completedOrders.filter(
                                o => o.status === 'completed'
                            ).length,
                            color: '#10B981',
                            icon: CheckCircle
                        },
                        {
                            label: 'Total',
                            value: orders.length,
                            color: '#94A3B8',
                            icon: Package
                        },
                        {
                            label: 'Revenue',
                            value: `₹${totalRevenue}`,
                            color: '#10B981',
                            icon: TrendingUp
                        },
                    ].map((stat, i) => {
                        const Icon = stat.icon
                        return (
                            <div key={i}
                                className="p-3 rounded-2xl text-center"
                                style={{ backgroundColor: '#1A1D27',
                                         border: '1px solid #2E3148' }}>
                                <Icon size={16} color={stat.color}
                                    className="mx-auto mb-1" />
                                <p className="text-lg font-bold"
                                    style={{ color: stat.color }}>
                                    {stat.value}
                                </p>
                                <p className="text-xs"
                                    style={{ color: '#64748B' }}>
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
                            className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                            style={{
                                backgroundColor: activeTab === tab.key
                                    ? '#10B981' : '#1A1D27',
                                color: activeTab === tab.key
                                    ? '#ffffff' : '#64748B',
                                border: '1px solid',
                                borderColor: activeTab === tab.key
                                    ? '#10B981' : '#2E3148'
                            }}>
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Orders List */}
                {displayOrders.length === 0 ? (
                    <div className="flex flex-col items-center 
                                    justify-center py-16">
                        <Package size={40} color="#2E3148" className="mb-3" />
                        <p className="text-sm font-medium"
                            style={{ color: '#F1F5F9' }}>
                            {activeTab === 'active'
                                ? 'No active orders'
                                : 'No order history'}
                        </p>
                        <p className="text-xs mt-1"
                            style={{ color: '#64748B' }}>
                            {activeTab === 'active'
                                ? 'New orders will appear here'
                                : 'Completed orders will appear here'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {displayOrders.map(order => {
                            const nextStatus = NEXT_STATUS[order.status]
                            const isUpdating = updatingOrder === order._id

                            return (
                                <div key={order._id}
                                    className="p-4 rounded-2xl"
                                    style={{ backgroundColor: '#1A1D27',
                                             border: '1px solid #2E3148' }}>

                                    {/* Top Row */}
                                    <div className="flex items-center 
                                                    justify-between mb-3">
                                        <span className="text-sm font-bold 
                                                         font-mono"
                                            style={{ color: '#10B981' }}>
                                            #{order.pickupToken}
                                        </span>
                                        <StatusBadge
                                            status={order.status}
                                            size="sm"
                                        />
                                    </div>

                                    {/* File Name */}
                                    <p className="text-sm font-medium 
                                                  truncate mb-2"
                                        style={{ color: '#F1F5F9' }}>
                                        {order.fileName}
                                    </p>

                                    {/* Tags */}
                                    <div className="flex items-center 
                                                    gap-2 mb-3">
                                        {[
                                            order.printConfig?.paperSize,
                                            `${order.pageCount} pages`,
                                            `${order.printConfig?.copies} ${order.printConfig?.copies > 1 ? 'copies' : 'copy'}`,
                                        ].map((tag, i) => (
                                            <span key={i}
                                                className="text-xs px-2 py-1 
                                                           rounded-lg"
                                                style={{
                                                    backgroundColor: '#222536',
                                                    color: '#94A3B8'
                                                }}>
                                                {tag}
                                            </span>
                                        ))}
                                        <span className="ml-auto text-sm 
                                                         font-bold"
                                            style={{ color: '#10B981' }}>
                                            ₹{order.totalAmount}
                                        </span>
                                    </div>

                                    {/* Action Buttons */}
                                    {nextStatus && (
                                        <div className="flex gap-2">
                                            {order.status === 'pending' && (
                                                <button
                                                    onClick={() => rejectOrder(
                                                        order._id
                                                    )}
                                                    disabled={isUpdating}
                                                    className="flex-1 py-2.5 
                                                               rounded-xl text-sm 
                                                               font-medium"
                                                    style={{
                                                        backgroundColor: '#2D1515',
                                                        color: '#EF4444',
                                                        border: '1px solid #EF4444',
                                                        opacity: isUpdating ? 0.6 : 1
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
                                                className="flex-1 py-2.5 
                                                           rounded-xl text-sm 
                                                           font-semibold"
                                                style={{
                                                    backgroundColor: '#10B981',
                                                    color: '#ffffff',
                                                    opacity: isUpdating ? 0.6 : 1
                                                }}>
                                                {isUpdating
                                                    ? 'Updating...'
                                                    : NEXT_STATUS_LABEL[order.status]}
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
                        style={{ borderTop: '1px solid #2E3148' }}>
                        <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="w-9 h-9 rounded-lg flex items-center justify-center disabled:opacity-40"
                            style={{ backgroundColor: '#1A1D27',
                                     border: '1px solid #2E3148' }}>
                            <ChevronLeft size={18} color="#F1F5F9" />
                        </button>
                        
                        <span className="text-sm" style={{ color: '#94A3B8' }}>
                            Page {currentPage} of {totalPages}
                        </span>
                        
                        <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="w-9 h-9 rounded-lg flex items-center justify-center disabled:opacity-40"
                            style={{ backgroundColor: '#1A1D27',
                                     border: '1px solid #2E3148' }}>
                            <ChevronRight size={18} color="#F1F5F9" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}

export default Dashboard