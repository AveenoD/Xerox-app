import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
    ArrowLeft, AlertCircle, FileText, Clock, 
    CheckCircle, XCircle, AlertTriangle, MessageSquare,
    ChevronRight, Plus
} from 'lucide-react'
import Loader from '../../components/common/Loader.jsx'
import api from '../../utils/axios.js'

const DISPUTE_REASONS = [
    { value: 'wrong_print', label: 'Wrong Print', icon: FileText },
    { value: 'missing_pages', label: 'Missing Pages', icon: FileText },
    { value: 'quality_issue', label: 'Quality Issue', icon: AlertTriangle },
    { value: 'wrong_copies', label: 'Wrong Number of Copies', icon: FileText },
    { value: 'not_received', label: 'Did Not Receive', icon: XCircle },
    { value: 'other', label: 'Other', icon: MessageSquare }
]

const STATUS_CONFIG = {
    open: { color: '#EAB308', bg: '#2D2000', label: 'Open' },
    under_review: { color: '#3B82F6', bg: '#0D1B2B', label: 'Under Review' },
    resolved_customer_favor: { color: '#10B981', bg: '#0D2B1F', label: 'Resolved - Refunded' },
    resolved_vendor_favor: { color: '#64748B', bg: '#1A1D27', label: 'Resolved - Declined' }
}

const Dispute = () => {
    const [completedOrders, setCompletedOrders] = useState([])
    const [disputes, setDisputes] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    
    // Form state
    const [showForm, setShowForm] = useState(false)
    const [selectedOrder, setSelectedOrder] = useState('')
    const [reason, setReason] = useState('')
    const [description, setDescription] = useState('')
    const [submitting, setSubmitting] = useState(false)

    const navigate = useNavigate()

    const fetchData = async () => {
        try {
            // Fetch completed orders
            const ordersRes = await api.get('/orders/my-orders')
            const completed = ordersRes.data.data?.filter(
                order => order.status === 'completed'
            ) || []
            setCompletedOrders(completed)

            // Fetch disputes
            const disputesRes = await api.get('/dispute/me')
            setDisputes(disputesRes.data.data || [])
        } catch (err) {
            setError('Could not load data')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!selectedOrder || !reason) return

        setSubmitting(true)
        setError('')
        setSuccess('')

        try {
            await api.post('/dispute', {
                orderId: selectedOrder,
                reason,
                description
            })
            
            setSuccess('Dispute filed successfully!')
            setShowForm(false)
            setSelectedOrder('')
            setReason('')
            setDescription('')
            fetchData()
            
            setTimeout(() => setSuccess(''), 3000)
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to file dispute')
        } finally {
            setSubmitting(false)
        }
    }

    const getOrderById = (orderId) => {
        return completedOrders.find(o => o._id === orderId)
    }

    if (loading) return <Loader />

    return (
        <div className="min-h-screen safe-area-pb"
            style={{ backgroundColor: '#0F1117' }}>

            {/* Header */}
            <div className="sticky top-0 z-10 px-4 py-4"
                style={{ backgroundColor: '#0F1117',
                         borderBottom: '1px solid #2E3148' }}>
                <div className="max-w-lg mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button onClick={() => navigate(-1)}
                            className="w-9 h-9 rounded-xl flex items-center justify-center"
                            style={{ backgroundColor: '#1A1D27',
                                     border: '1px solid #2E3148' }}>
                            <ArrowLeft size={16} color="#F1F5F9" />
                        </button>
                        <h1 className="text-base font-semibold"
                            style={{ color: '#F1F5F9' }}>
                            Disputes
                        </h1>
                    </div>
                    
                    {!showForm && completedOrders.length > 0 && (
                        <button
                            onClick={() => setShowForm(true)}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1"
                            style={{ backgroundColor: '#10B981', color: '#ffffff' }}>
                            <Plus size={14} />
                            File Dispute
                        </button>
                    )}
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

                {/* Success */}
                {success && (
                    <div className="px-4 py-3 rounded-xl text-sm"
                        style={{ backgroundColor: '#0D2B1F',
                                 color: '#10B981',
                                 border: '1px solid #10B981' }}>
                        {success}
                    </div>
                )}

                {/* File Dispute Form */}
                {showForm && (
                    <div className="p-4 rounded-2xl"
                        style={{ backgroundColor: '#1A1D27',
                                 border: '1px solid #2E3148' }}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-semibold"
                                style={{ color: '#F1F5F9' }}>
                                File a Dispute
                            </h3>
                            <button
                                onClick={() => setShowForm(false)}
                                className="text-xs"
                                style={{ color: '#64748B' }}>
                                Cancel
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Order Selection */}
                            <div>
                                <label className="text-xs mb-1.5 block"
                                    style={{ color: '#94A3B8' }}>
                                    Select Order *
                                </label>
                                <select
                                    value={selectedOrder}
                                    onChange={(e) => setSelectedOrder(e.target.value)}
                                    required
                                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                                    style={{ backgroundColor: '#0F1117',
                                             border: '1px solid #2E3148',
                                             color: '#F1F5F9' }}>
                                    <option value="">Choose an order</option>
                                    {completedOrders.map(order => (
                                        <option key={order._id} value={order._id}>
                                            #{order.pickupToken} - {order.fileName} (₹{order.totalAmount})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Reason Selection */}
                            <div>
                                <label className="text-xs mb-1.5 block"
                                    style={{ color: '#94A3B8' }}>
                                    Reason *
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    {DISPUTE_REASONS.map(({ value, label, icon: Icon }) => (
                                        <button
                                            key={value}
                                            type="button"
                                            onClick={() => setReason(value)}
                                            className={`p-3 rounded-xl text-left transition-all ${
                                                reason === value ? 'ring-1' : ''
                                            }`}
                                            style={{
                                                backgroundColor: reason === value ? '#0D2B1F' : '#0F1117',
                                                border: `1px solid ${reason === value ? '#10B981' : '#2E3148'}`,
                                                color: reason === value ? '#10B981' : '#94A3B8'
                                            }}>
                                            <Icon size={16} className="mb-1" />
                                            <p className="text-xs font-medium">{label}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Description */}
                            <div>
                                <label className="text-xs mb-1.5 block"
                                    style={{ color: '#94A3B8' }}>
                                    Description
                                </label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Describe the issue in detail..."
                                    rows={3}
                                    maxLength={500}
                                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
                                    style={{ backgroundColor: '#0F1117',
                                             border: '1px solid #2E3148',
                                             color: '#F1F5F9' }}
                                />
                                <p className="text-xs mt-1 text-right" style={{ color: '#64748B' }}>
                                    {description.length}/500
                                </p>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={!selectedOrder || !reason || submitting}
                                className="w-full py-3 rounded-xl text-sm font-medium disabled:opacity-50"
                                style={{ backgroundColor: '#10B981', color: '#ffffff' }}>
                                {submitting ? 'Submitting...' : 'File Dispute'}
                            </button>
                        </form>
                    </div>
                )}

                {/* No Completed Orders */}
                {completedOrders.length === 0 && !showForm && (
                    <div className="flex flex-col items-center justify-center py-16"
                        style={{ backgroundColor: '#1A1D27',
                                 border: '1px solid #2E3148',
                                 borderRadius: '1rem' }}>
                        <CheckCircle size={48} color="#2E3148" className="mb-4" />
                        <p className="text-base font-medium mb-1"
                            style={{ color: '#F1F5F9' }}>
                            No eligible orders
                        </p>
                        <p className="text-sm text-center px-8 mb-6"
                            style={{ color: '#64748B' }}>
                            You can only file disputes for completed orders
                        </p>
                        <button
                            onClick={() => navigate('/my-orders')}
                            className="px-6 py-2.5 rounded-xl text-sm font-medium"
                            style={{ backgroundColor: '#10B981', color: '#fff' }}>
                            View My Orders
                        </button>
                    </div>
                )}

                {/* My Disputes List */}
                {disputes.length > 0 && (
                    <div>
                        <h3 className="text-sm font-semibold mb-3"
                            style={{ color: '#F1F5F9' }}>
                            My Disputes
                        </h3>

                        <div className="space-y-3">
                            {disputes.map((dispute) => {
                                const statusConfig = STATUS_CONFIG[dispute.status] || STATUS_CONFIG.open
                                
                                return (
                                    <div key={dispute._id}
                                        className="p-4 rounded-2xl"
                                        style={{ backgroundColor: '#1A1D27',
                                                 border: '1px solid #2E3148' }}>
                                        {/* Header */}
                                        <div className="flex items-start justify-between mb-3">
                                            <div>
                                                <p className="text-xs mb-1"
                                                    style={{ color: '#64748B' }}>
                                                    Order #{dispute.orderId?.pickupToken}
                                                </p>
                                                <p className="text-sm font-medium truncate max-w-[200px]"
                                                    style={{ color: '#F1F5F9' }}>
                                                    {dispute.orderId?.fileName}
                                                </p>
                                            </div>
                                            <span className="text-xs px-2 py-1 rounded-full"
                                                style={{ 
                                                    backgroundColor: statusConfig.bg,
                                                    color: statusConfig.color
                                                }}>
                                                {statusConfig.label}
                                            </span>
                                        </div>

                                        {/* Reason */}
                                        <div className="flex items-center gap-2 mb-3">
                                            <AlertCircle size={14} color="#64748B" />
                                            <span className="text-sm" style={{ color: '#94A3B8' }}>
                                                {DISPUTE_REASONS.find(r => r.value === dispute.reason)?.label || dispute.reason}
                                            </span>
                                        </div>

                                        {/* Description */}
                                        {dispute.description && (
                                            <p className="text-sm mb-3 p-2 rounded-lg"
                                                style={{ backgroundColor: '#0F1117',
                                                         color: '#94A3B8' }}>
                                                "{dispute.description}"
                                            </p>
                                        )}

                                        {/* Footer */}
                                        <div className="flex items-center justify-between pt-3"
                                            style={{ borderTop: '1px solid #2E3148' }}>
                                            <div className="flex items-center gap-1.5">
                                                <Clock size={12} color="#64748B" />
                                                <span className="text-xs" style={{ color: '#64748B' }}>
                                                    Filed {new Date(dispute.createdAt).toLocaleDateString('en-IN', {
                                                        day: 'numeric',
                                                        month: 'short'
                                                    })}
                                                </span>
                                            </div>
                                            <span className="text-sm font-medium"
                                                style={{ color: '#10B981' }}>
                                                ₹{dispute.orderId?.totalAmount}
                                            </span>
                                        </div>

                                        {/* Resolution Note */}
                                        {dispute.status === 'resolved_customer_favor' && (
                                            <div className="mt-3 p-2 rounded-lg flex items-center gap-2"
                                                style={{ backgroundColor: '#0D2B1F' }}>
                                                <CheckCircle size={14} color="#10B981" />
                                                <span className="text-xs" style={{ color: '#10B981' }}>
                                                    Refund credited to wallet
                                                </span>
                                            </div>
                                        )}

                                        {dispute.status === 'resolved_vendor_favor' && dispute.resolutionNote && (
                                            <div className="mt-3 p-2 rounded-lg"
                                                style={{ backgroundColor: '#222536' }}>
                                                <p className="text-xs" style={{ color: '#64748B' }}>
                                                    <span className="font-medium">Resolution:</span> {dispute.resolutionNote}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}

                {/* Empty State - No Disputes */}
                {disputes.length === 0 && !showForm && completedOrders.length > 0 && (
                    <div className="flex flex-col items-center justify-center py-16"
                        style={{ backgroundColor: '#1A1D27',
                                 border: '1px solid #2E3148',
                                 borderRadius: '1rem' }}>
                        <AlertCircle size={48} color="#2E3148" className="mb-4" />
                        <p className="text-base font-medium mb-1"
                            style={{ color: '#F1F5F9' }}>
                            No disputes filed
                        </p>
                        <p className="text-sm text-center px-8"
                            style={{ color: '#64748B' }}>
                            Having an issue? File a dispute for a completed order
                        </p>
                    </div>
                )}

                {/* Info Note */}
                <div className="p-3 rounded-xl flex items-start gap-2"
                    style={{ backgroundColor: '#1A1D27',
                             border: '1px solid #2E3148' }}>
                    <AlertCircle size={14} color="#64748B" className="flex-shrink-0 mt-0.5" />
                    <p className="text-xs" style={{ color: '#64748B' }}>
                        Disputes can only be filed for completed orders within 24 hours. 
                        Our team will review and resolve disputes within 2-3 business days.
                    </p>
                </div>

            </div>
        </div>
    )
}

export default Dispute
