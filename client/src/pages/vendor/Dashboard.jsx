import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    Package, Clock, Printer,
    CheckCircle, XCircle, ToggleLeft,
    ToggleRight, Settings, LogOut,
    ChevronRight
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext.jsx'
import api from '../../utils/axios.js'
import Loader from '../../components/common/Loader.jsx'

const STATUS_CONFIG = {
    pending:   { label: 'Pending',   color: '#EAB308', bg: '#2D2500', icon: Clock },
    accepted:  { label: 'Accepted',  color: '#3B82F6', bg: '#0D1B2B', icon: Package },
    printing:  { label: 'Printing',  color: '#8B5CF6', bg: '#1A0D2B', icon: Printer },
    completed: { label: 'Completed', color: '#10B981', bg: '#0D2B1F', icon: CheckCircle },
    rejected:  { label: 'Rejected',  color: '#EF4444', bg: '#2D1515', icon: XCircle },
}

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

    const { user, logout } = useAuth()
    const navigate = useNavigate()

    useEffect(() => {
        fetchDashboard()
    }, [])

    const fetchDashboard = async () => {
        try {
            const [vendorRes, ordersRes] = await Promise.all([
                api.get('/vendor/profile/me'),
                api.get('/orders/vendor-orders')
            ])
            setVendor(vendorRes.data.data)
            setOrders(ordersRes.data.data)
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

    const updateStatus = async (orderId, status) => {
        setUpdatingOrder(orderId)
        try {
            const res = await api.patch(`/orders/${orderId}/status`, { status })
            setOrders(prev => prev.map(o =>
                o._id === orderId ? { ...o, status } : o
            ))
        } catch(err) {
            setError('Could not update order status')
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

    // Filter orders by tab
    const activeOrders = orders.filter(o =>
        ['pending', 'accepted', 'printing'].includes(o.status)
    )
    const completedOrders = orders.filter(o =>
        ['completed', 'rejected'].includes(o.status)
    )
    const displayOrders = activeTab === 'active' ? activeOrders : completedOrders

    if(loading) return (
       <Loader />
    )

    return (
        <div className="min-h-screen pb-10"
            style={{ backgroundColor: '#0F1117' }}>

            {/* Header */}
            <div className="sticky top-0 z-10 px-4 py-4"
                style={{ backgroundColor: '#0F1117',
                         borderBottom: '1px solid #2E3148' }}>
                <div className="max-w-2xl mx-auto flex items-center justify-between">
                    <div>
                        <h1 className="text-base font-bold"
                            style={{ color: '#F1F5F9' }}>
                            Vendor Dashboard
                        </h1>
                        <p className="text-xs"
                            style={{ color: '#64748B' }}>
                            {vendor?.shopName || user?.fullName}
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Manage Shop */}
                        <button
                            onClick={() => navigate('/manage-shop')}
                            className="w-9 h-9 rounded-xl flex items-center justify-center"
                            style={{ backgroundColor: '#1A1D27',
                                     border: '1px solid #2E3148' }}>
                            <Settings size={16} color="#94A3B8" />
                        </button>

                        {/* Logout */}
                        <button
                            onClick={logout}
                            className="w-9 h-9 rounded-xl flex items-center justify-center"
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

                {/* Shop Status Card */}
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
                                style={{ color: vendor.isOpen ? '#10B981' : '#EF4444' }}>
                                {vendor.isOpen
                                    ? 'Your shop is visible to customers'
                                    : 'Your shop is hidden from customers'}
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
                <div className="grid grid-cols-3 gap-3">
                    {[
                        { label: 'Active', value: activeOrders.length, color: '#3B82F6' },
                        { label: 'Completed', value: completedOrders.filter(o => o.status === 'completed').length, color: '#10B981' },
                        { label: 'Total', value: orders.length, color: '#94A3B8' },
                    ].map((stat, i) => (
                        <div key={i} className="p-3 rounded-2xl text-center"
                            style={{ backgroundColor: '#1A1D27',
                                     border: '1px solid #2E3148' }}>
                            <p className="text-2xl font-bold"
                                style={{ color: stat.color }}>
                                {stat.value}
                            </p>
                            <p className="text-xs mt-0.5"
                                style={{ color: '#64748B' }}>
                                {stat.label}
                            </p>
                        </div>
                    ))}
                </div>

                {/* Tabs */}
                <div className="flex gap-2">
                    {[
                        { key: 'active', label: `Active (${activeOrders.length})` },
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
                    <div className="flex flex-col items-center justify-center py-16">
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
                            const status = STATUS_CONFIG[order.status]
                            const StatusIcon = status.icon
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
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-bold 
                                                             font-mono"
                                                style={{ color: '#10B981' }}>
                                                #{order.pickupToken}
                                            </span>
                                            <div className="flex items-center gap-1 
                                                            px-2 py-0.5 rounded-full"
                                                style={{ backgroundColor: status.bg }}>
                                                <StatusIcon size={10}
                                                    color={status.color} />
                                                <span className="text-xs"
                                                    style={{ color: status.color }}>
                                                    {status.label}
                                                </span>
                                            </div>
                                        </div>
                                        <span className="text-xs"
                                            style={{ color: '#64748B' }}>
                                            {new Date(order.createdAt)
                                                .toLocaleDateString('en-IN', {
                                                    day: 'numeric',
                                                    month: 'short'
                                                })}
                                        </span>
                                    </div>

                                    {/* File Name */}
                                    <p className="text-sm font-medium truncate mb-2"
                                        style={{ color: '#F1F5F9' }}>
                                        {order.fileName}
                                    </p>

                                    {/* Print Config Tags */}
                                    <div className="flex items-center gap-2 mb-3">
                                        {[
                                            order.printConfig?.paperSize,
                                            `${order.pageCount} pages`,
                                            `${order.printConfig?.copies} ${order.printConfig?.copies > 1 ? 'copies' : 'copy'}`,
                                        ].map((tag, i) => (
                                            <span key={i}
                                                className="text-xs px-2 py-1 rounded-lg"
                                                style={{ backgroundColor: '#222536',
                                                         color: '#94A3B8' }}>
                                                {tag}
                                            </span>
                                        ))}
                                        <span className="ml-auto text-sm font-bold"
                                            style={{ color: '#10B981' }}>
                                            ₹{order.totalAmount}
                                        </span>
                                    </div>

                                    {/* Action Buttons — only active orders */}
                                    {nextStatus && (
                                        <div className="flex gap-2">
                                            {/* Reject — only pending */}
                                            {order.status === 'pending' && (
                                                <button
                                                    onClick={() => rejectOrder(order._id)}
                                                    disabled={isUpdating}
                                                    className="flex-1 py-2.5 rounded-xl 
                                                               text-sm font-medium"
                                                    style={{
                                                        backgroundColor: '#2D1515',
                                                        color: '#EF4444',
                                                        border: '1px solid #EF4444',
                                                        opacity: isUpdating ? 0.6 : 1
                                                    }}>
                                                    Reject
                                                </button>
                                            )}

                                            {/* Next Status */}
                                            <button
                                                onClick={() => updateStatus(
                                                    order._id, nextStatus
                                                )}
                                                disabled={isUpdating}
                                                className="flex-1 py-2.5 rounded-xl 
                                                           text-sm font-semibold"
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

            </div>
        </div>
    )
}

export default Dashboard