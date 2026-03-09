import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { 
    ArrowLeft, FileText, Printer, 
    Clock, CheckCircle, XCircle, 
    Package, Star, Copy, Check
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

const PRINT_LABELS = {
    bw_single:     'B&W Single Side',
    bw_double:     'B&W Double Side',
    color_single:  'Color Single Side',
    color_double:  'Color Double Side',
}

const OrderDetail = () => {
    const [order, setOrder] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [copied, setCopied] = useState(false)
    const [ratingData, setRatingData] = useState({ score: 5, review: '' })
    const [ratingLoading, setRatingLoading] = useState(false)
    const [ratingSuccess, setRatingSuccess] = useState('')
    const [ratingError, setRatingError] = useState('')

    const { orderId } = useParams()
    const navigate = useNavigate()
    const { user } = useAuth()

    useEffect(() => {
        fetchOrder()
    }, [orderId])

    const fetchOrder = async () => {
        try {
            const res = await api.get(`/orders/${orderId}`)
            setOrder(res.data.data)
        } catch(err) {
            setError('Could not load order details')
        } finally {
            setLoading(false)
        }
    }

    const copyToken = () => {
        navigator.clipboard.writeText(order.pickupToken)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const handleRating = async () => {
        setRatingLoading(true)
        setRatingError('')
        try {
            await api.post(`/rating/${order.vendorId}/rate`, ratingData)
            setRatingSuccess('Rating submitted successfully!')
        } catch(err) {
            setRatingError(err.response?.data?.message || 'Rating failed')
        } finally {
            setRatingLoading(false)
        }
    }

    if(loading) return (
      <Loader />
    )

    if(error || !order) return (
        <div className="min-h-screen flex items-center justify-center"
            style={{ backgroundColor: '#0F1117' }}>
            <div className="text-center">
                <p className="text-sm mb-4" style={{ color: '#94A3B8' }}>
                    {error || 'Order not found'}
                </p>
                <button onClick={() => navigate(-1)}
                    className="px-6 py-2.5 rounded-xl text-sm font-medium"
                    style={{ backgroundColor: '#10B981', color: '#fff' }}>
                    Go Back
                </button>
            </div>
        </div>
    )

    const status = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending
    const StatusIcon = status.icon

    return (
        <div className="min-h-screen pb-10"
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
                        Order Details
                    </h1>
                </div>
            </div>

            <div className="max-w-lg mx-auto px-4 py-4 space-y-4">

                {/* Status + Token Card */}
                <div className="p-4 rounded-2xl"
                    style={{ backgroundColor: '#1A1D27',
                             border: '1px solid #2E3148' }}>

                    {/* Status */}
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2 px-3 py-1.5 
                                        rounded-full"
                            style={{ backgroundColor: status.bg }}>
                            <StatusIcon size={13} color={status.color} />
                            <span className="text-sm font-semibold"
                                style={{ color: status.color }}>
                                {status.label}
                            </span>
                        </div>
                        <span className="text-xs"
                            style={{ color: '#64748B' }}>
                            {new Date(order.createdAt).toLocaleDateString('en-IN', {
                                day: 'numeric', month: 'short', year: 'numeric'
                            })}
                        </span>
                    </div>

                    {/* Pickup Token */}
                    <div className="flex items-center justify-between px-4 py-3 
                                    rounded-xl mb-1"
                        style={{ backgroundColor: '#0F1117' }}>
                        <div>
                            <p className="text-xs mb-1"
                                style={{ color: '#64748B' }}>
                                Pickup Token
                            </p>
                            <span className="text-2xl font-bold tracking-widest"
                                style={{ color: '#10B981' }}>
                                #{order.pickupToken}
                            </span>
                        </div>
                        <button onClick={copyToken}
                            className="w-9 h-9 rounded-xl flex items-center 
                                       justify-center"
                            style={{ backgroundColor: '#1A1D27',
                                     border: '1px solid #2E3148' }}>
                            {copied
                                ? <Check size={15} color="#10B981" />
                                : <Copy size={15} color="#64748B" />
                            }
                        </button>
                    </div>
                    <p className="text-xs text-center"
                        style={{ color: '#64748B' }}>
                        Show this token at the shop to collect your order
                    </p>
                </div>

                {/* File Info */}
                <div className="p-4 rounded-2xl"
                    style={{ backgroundColor: '#1A1D27',
                             border: '1px solid #2E3148' }}>

                    <p className="text-xs font-semibold uppercase tracking-wider 
                                  mb-3"
                        style={{ color: '#64748B' }}>
                        File
                    </p>

                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center 
                                        justify-center flex-shrink-0"
                            style={{ backgroundColor: '#222536' }}>
                            <FileText size={18} color="#10B981" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate"
                                style={{ color: '#F1F5F9' }}>
                                {order.fileName}
                            </p>
                            <p className="text-xs mt-0.5"
                                style={{ color: '#64748B' }}>
                                {order.fileType?.toUpperCase()} • {order.pageCount} pages
                            </p>
                        </div>
                        <a href={order.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs px-3 py-1.5 rounded-lg"
                            style={{ backgroundColor: '#222536',
                                     color: '#94A3B8' }}>
                            View
                        </a>
                    </div>
                </div>

                {/* Print Config */}
                <div className="p-4 rounded-2xl"
                    style={{ backgroundColor: '#1A1D27',
                             border: '1px solid #2E3148' }}>

                    <p className="text-xs font-semibold uppercase tracking-wider 
                                  mb-3"
                        style={{ color: '#64748B' }}>
                        Print Settings
                    </p>

                    <div className="grid grid-cols-3 gap-2">
                        {[
                            { label: 'Paper', value: order.printConfig?.paperSize },
                            { label: 'Copies', value: order.printConfig?.copies },
                            { label: 'Type', value: PRINT_LABELS[order.printConfig?.printType] },
                        ].map((item, i) => (
                            <div key={i} className="px-3 py-2.5 rounded-xl text-center"
                                style={{ backgroundColor: '#222536' }}>
                                <p className="text-xs mb-1"
                                    style={{ color: '#64748B' }}>
                                    {item.label}
                                </p>
                                <p className="text-xs font-semibold"
                                    style={{ color: '#F1F5F9' }}>
                                    {item.value}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Payment Summary */}
                <div className="p-4 rounded-2xl"
                    style={{ backgroundColor: '#1A1D27',
                             border: '1px solid #2E3148' }}>

                    <p className="text-xs font-semibold uppercase tracking-wider 
                                  mb-3"
                        style={{ color: '#64748B' }}>
                        Payment
                    </p>

                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span style={{ color: '#64748B' }}>Method</span>
                            <span className="capitalize font-medium"
                                style={{ color: '#F1F5F9' }}>
                                {order.payment?.method === 'cash'
                                    ? 'Cash on Pickup' : 'UPI'}
                            </span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span style={{ color: '#64748B' }}>Platform Fee</span>
                            <span style={{ color: '#10B981' }}>Free</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span style={{ color: '#64748B' }}>Status</span>
                            <span className="capitalize"
                                style={{ 
                                    color: order.payment?.status === 'paid'
                                        ? '#10B981' : '#EAB308'
                                }}>
                                {order.payment?.status}
                            </span>
                        </div>
                        <div style={{ borderTop: '1px solid #2E3148' }}
                            className="pt-2 mt-1 flex justify-between">
                            <span className="text-sm font-semibold"
                                style={{ color: '#F1F5F9' }}>
                                Total
                            </span>
                            <span className="text-base font-bold"
                                style={{ color: '#10B981' }}>
                                ₹{order.totalAmount}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Rating — only if completed */}
                {order.status === 'completed' && user?.role === 'customer' && (
                    <div className="p-4 rounded-2xl"
                        style={{ backgroundColor: '#1A1D27',
                                 border: '1px solid #2E3148' }}>

                        <p className="text-xs font-semibold uppercase tracking-wider 
                                      mb-3"
                            style={{ color: '#64748B' }}>
                            Rate this Shop
                        </p>

                        {ratingSuccess ? (
                            <div className="flex items-center gap-2 px-4 py-3 
                                            rounded-xl"
                                style={{ backgroundColor: '#0D2B1F' }}>
                                <CheckCircle size={16} color="#10B981" />
                                <p className="text-sm"
                                    style={{ color: '#10B981' }}>
                                    {ratingSuccess}
                                </p>
                            </div>
                        ) : (
                            <>
                                {/* Stars */}
                                <div className="flex gap-2 mb-3">
                                    {[1, 2, 3, 4, 5].map(star => (
                                        <button key={star}
                                            onClick={() => setRatingData(
                                                prev => ({ ...prev, score: star })
                                            )}>
                                            <Star
                                                size={28}
                                                fill={star <= ratingData.score
                                                    ? '#EAB308' : 'none'}
                                                color={star <= ratingData.score
                                                    ? '#EAB308' : '#2E3148'}
                                            />
                                        </button>
                                    ))}
                                </div>

                                {/* Review */}
                                <textarea
                                    value={ratingData.review}
                                    onChange={(e) => setRatingData(
                                        prev => ({ ...prev, review: e.target.value })
                                    )}
                                    placeholder="Write a review (optional)"
                                    rows={3}
                                    className="w-full px-4 py-3 rounded-xl text-sm 
                                               outline-none resize-none mb-3"
                                    style={{
                                        backgroundColor: '#222536',
                                        border: '1px solid #2E3148',
                                        color: '#F1F5F9'
                                    }}
                                />

                                {ratingError && (
                                    <p className="text-xs mb-2"
                                        style={{ color: '#EF4444' }}>
                                        {ratingError}
                                    </p>
                                )}

                                <button
                                    onClick={handleRating}
                                    disabled={ratingLoading}
                                    className="w-full py-3 rounded-xl text-sm 
                                               font-semibold"
                                    style={{
                                        backgroundColor: '#10B981',
                                        color: '#fff',
                                        opacity: ratingLoading ? 0.6 : 1
                                    }}>
                                    {ratingLoading ? 'Submitting...' : 'Submit Rating'}
                                </button>
                            </>
                        )}
                    </div>
                )}

            </div>
        </div>
    )
}

export default OrderDetail