import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
    ArrowLeft, Phone, Navigation, Clock, CheckCircle2, 
    Circle, Printer, Package, MapPin, Loader2, AlertCircle
} from 'lucide-react'
import api from '../../utils/axios.js'
import usePolling from '../../hooks/usePolling.js'

/**
 * Real-Time Order Tracking Screen (Zepto-Style)
 * 
 * API Endpoints:
 * - GET /api/orders/{orderId} - Get order details
 *   Response: Order object with status, pickupToken, vendor details
 * 
 * Polling: 5-second intervals for real-time updates
 */

const ORDER_STEPS = [
    { key: 'pending', label: 'Order Placed', icon: Clock },
    { key: 'accepted', label: 'Order Accepted', icon: CheckCircle2 },
    { key: 'printing', label: 'Printing...', icon: Printer },
    { key: 'completed', label: 'Ready for Pickup', icon: Package },
]

const OrderTracker = () => {
    const { orderId } = useParams()
    const navigate = useNavigate()
    
    const [order, setOrder] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    // Fetch order details
    const fetchOrder = async () => {
        try {
            const res = await api.get(`/orders/${orderId}`)
            setOrder(res.data.data)
            setError('')
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load order')
        } finally {
            setLoading(false)
        }
    }

    // Initial load
    useEffect(() => {
        fetchOrder()
    }, [orderId])

    // Real-time polling (5 second interval)
    usePolling(fetchOrder, 5000, !!orderId)

    // Get current step index
    const getCurrentStepIndex = () => {
        if (!order) return 0
        const statusIndex = ORDER_STEPS.findIndex(step => step.key === order.status)
        return statusIndex >= 0 ? statusIndex : 0
    }

    // Format pickup token
    const formatToken = (token) => {
        if (!token) return ''
        return token.startsWith('#') ? token : `#${token}`
    }

    // Handle get directions
    const handleGetDirections = () => {
        if (!order?.vendorId?.location?.coordinates) return
        const [lng, lat] = order.vendorId.location.coordinates
        window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank')
    }

    // Handle call vendor
    const handleCallVendor = () => {
        if (!order?.vendorId?.userId?.phone) return
        window.open(`tel:${order.vendorId.userId.phone}`)
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0F172A' }}>
                <Loader2 size={32} color="#10B981" className="animate-spin" />
            </div>
        )
    }

    if (error || !order) {
        return (
            <div className="min-h-screen safe-area-pb p-4" style={{ backgroundColor: '#0F172A' }}>
                <div className="max-w-lg mx-auto pt-20 text-center">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                        style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}>
                        <AlertCircle size={28} color="#EF4444" />
                    </div>
                    <p className="text-sm" style={{ color: '#94A3B8' }}>{error || 'Order not found'}</p>
                    <button
                        onClick={() => navigate('/my-orders')}
                        className="mt-4 px-6 py-3 rounded-xl font-semibold text-sm"
                        style={{ backgroundColor: '#10B981', color: '#fff' }}
                    >
                        Back to Orders
                    </button>
                </div>
            </div>
        )
    }

    const currentStep = getCurrentStepIndex()
    const isCompleted = order.status === 'completed'

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
                        onClick={() => navigate('/my-orders')}
                        className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors active:scale-95"
                        style={{ backgroundColor: 'rgba(30, 41, 59, 0.7)' }}
                    >
                        <ArrowLeft size={20} color="#F1F5F9" />
                    </button>
                    <div>
                        <h1 className="text-lg font-bold" style={{ color: '#F1F5F9' }}>
                            Track Order
                        </h1>
                    </div>
                </div>
            </header>

            <main className="max-w-lg mx-auto px-4 py-6">
                {/* Token ID Card */}
                <div className="glass-card p-6 mb-6 text-center">
                    <p className="text-xs font-medium mb-2" style={{ color: '#64748B' }}>
                        Pickup Token
                    </p>
                    <h2 className="text-4xl font-bold font-mono tracking-wider text-glow-primary"
                        style={{ color: '#F1F5F9' }}>
                        {formatToken(order.pickupToken)}
                    </h2>
                    <p className="text-xs mt-3" style={{ color: '#64748B' }}>
                        Show this token when collecting your order
                    </p>
                </div>

                {/* Progress Tracker */}
                <div className="glass-card p-6 mb-6">
                    <h3 className="text-sm font-semibold mb-6" style={{ color: '#F1F5F9' }}>
                        Order Progress
                    </h3>
                    
                    <div className="relative">
                        {/* Vertical Line */}
                        <div className="absolute left-[19px] top-8 bottom-8 w-0.5"
                            style={{ backgroundColor: 'rgba(51, 65, 85, 0.5)' }}>
                            <div 
                                className="w-full transition-all duration-500"
                                style={{ 
                                    backgroundColor: '#10B981',
                                    height: `${(currentStep / (ORDER_STEPS.length - 1)) * 100}%`
                                }}
                            />
                        </div>

                        {/* Steps */}
                        <div className="space-y-6">
                            {ORDER_STEPS.map((step, index) => {
                                const Icon = step.icon
                                const isActive = index <= currentStep
                                const isCurrent = index === currentStep
                                
                                return (
                                    <div key={step.key} className="flex items-center gap-4 relative">
                                        {/* Icon Circle */}
                                        <div 
                                            className={`w-10 h-10 rounded-full flex items-center justify-center z-10 transition-all duration-300 ${
                                                isCurrent ? 'animate-pulse-glow' : ''
                                            }`}
                                            style={{
                                                backgroundColor: isActive 
                                                    ? 'rgba(16, 185, 129, 0.2)' 
                                                    : 'rgba(30, 41, 59, 0.8)',
                                                border: `2px solid ${isActive ? '#10B981' : 'rgba(51, 65, 85, 0.5)'}`,
                                                boxShadow: isCurrent ? '0 0 20px rgba(16, 185, 129, 0.4)' : 'none'
                                            }}
                                        >
                                            <Icon 
                                                size={18} 
                                                color={isActive ? '#10B981' : '#64748B'}
                                                strokeWidth={isActive ? 2.5 : 1.5}
                                            />
                                        </div>

                                        {/* Label */}
                                        <div className="flex-1">
                                            <p 
                                                className="text-sm font-medium"
                                                style={{ color: isActive ? '#F1F5F9' : '#64748B' }}
                                            >
                                                {step.label}
                                            </p>
                                            {isCurrent && (
                                                <p className="text-xs mt-0.5" style={{ color: '#10B981' }}>
                                                    In progress
                                                </p>
                                            )}
                                        </div>

                                        {/* Checkmark for completed */}
                                        {index < currentStep && (
                                            <CheckCircle2 size={18} color="#10B981" />
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>

                {/* Order Details */}
                <div className="glass-card p-6 mb-6">
                    <h3 className="text-sm font-semibold mb-4" style={{ color: '#F1F5F9' }}>
                        Order Details
                    </h3>
                    
                    <div className="space-y-4">
                        <div className="flex justify-between">
                            <span className="text-sm" style={{ color: '#64748B' }}>Document</span>
                            <span className="text-sm font-medium truncate max-w-[180px]" style={{ color: '#F1F5F9' }}>
                                {order.fileName}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm" style={{ color: '#64748B' }}>Pages</span>
                            <span className="text-sm font-medium" style={{ color: '#F1F5F9' }}>
                                {order.pageCount}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm" style={{ color: '#64748B' }}>Print Type</span>
                            <span className="text-sm font-medium" style={{ color: '#F1F5F9' }}>
                                {order.printConfig?.paperSize} • {order.printConfig?.printType?.replace('_', ' ')}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm" style={{ color: '#64748B' }}>Copies</span>
                            <span className="text-sm font-medium" style={{ color: '#F1F5F9' }}>
                                {order.printConfig?.copies}
                            </span>
                        </div>
                        <div className="flex justify-between pt-3" style={{ borderTop: '1px solid rgba(51, 65, 85, 0.5)' }}>
                            <span className="text-sm font-semibold" style={{ color: '#F1F5F9' }}>Total</span>
                            <span className="text-lg font-bold" style={{ color: '#10B981' }}>
                                ₹{order.totalAmount}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Shop Info */}
                <div className="glass-card p-6 mb-6">
                    <h3 className="text-sm font-semibold mb-4" style={{ color: '#F1F5F9' }}>
                        Print Shop
                    </h3>
                    
                    <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: 'rgba(30, 41, 59, 0.8)' }}>
                            {order.vendorId?.shopPhoto ? (
                                <img 
                                    src={order.vendorId.shopPhoto}
                                    alt={order.vendorId.shopName}
                                    className="w-full h-full object-cover rounded-xl"
                                />
                            ) : (
                                <span className="text-xl">🖨️</span>
                            )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold" style={{ color: '#F1F5F9' }}>
                                {order.vendorId?.shopName}
                            </p>
                            <div className="flex items-center gap-1 mt-1">
                                <MapPin size={12} color="#64748B" />
                                <p className="text-xs truncate" style={{ color: '#64748B' }}>
                                    {order.vendorId?.address}, {order.vendorId?.city}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                    <button
                        onClick={handleGetDirections}
                        className="w-full py-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                        style={{ 
                            backgroundColor: '#10B981',
                            color: '#ffffff',
                            boxShadow: '0 4px 20px rgba(16, 185, 129, 0.3)'
                        }}
                    >
                        <Navigation size={18} />
                        Get Directions
                    </button>
                    
                    <button
                        onClick={handleCallVendor}
                        className="w-full py-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                        style={{ 
                            backgroundColor: 'rgba(30, 41, 59, 0.7)',
                            color: '#F1F5F9',
                            border: '1px solid rgba(51, 65, 85, 0.5)'
                        }}
                    >
                        <Phone size={18} />
                        Call Vendor
                    </button>
                </div>
            </main>
        </div>
    )
}

export default OrderTracker