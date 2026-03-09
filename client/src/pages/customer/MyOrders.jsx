import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft, Package, Clock, CheckCircle, XCircle, Printer } from 'lucide-react'
import api from '../../utils/axios.js'
import Loader from '../../components/common/Loader.jsx'

const STATUS_CONFIG = {
    pending:   { label: 'Pending',   color: '#EAB308', bg: '#2D2500', icon: Clock },
    accepted:  { label: 'Accepted',  color: '#3B82F6', bg: '#0D1B2B', icon: Package },
    printing:  { label: 'Printing',  color: '#8B5CF6', bg: '#1A0D2B', icon: Printer },
    completed: { label: 'Completed', color: '#10B981', bg: '#0D2B1F', icon: CheckCircle },
    rejected:  { label: 'Rejected',  color: '#EF4444', bg: '#2D1515', icon: XCircle },
}

const MyOrders = () => {
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    const navigate = useNavigate()
    const location = useLocation()
    const newOrder = location.state?.newOrder

    useEffect(() => {
        fetchOrders()
    }, [])

    const fetchOrders = async () => {
        try {
            const res = await api.get('/orders/my-orders')
            setOrders(res.data.data)
        } catch(err) {
            if(err.response?.status === 400){
                setOrders([]) // No orders — empty state
            } else {
                setError('Could not load orders')
            }
        } finally {
            setLoading(false)
        }
    }

    if(loading) return (
        <Loader />
    )

    return (
        <div className="min-h-screen pb-24"
            style={{ backgroundColor: '#0F1117' }}>

            {/* Header */}
            <div className="sticky top-0 z-10 px-4 py-4"
                style={{ backgroundColor: '#0F1117',
                         borderBottom: '1px solid #2E3148' }}>
                <div className="max-w-lg mx-auto flex items-center gap-3">
                    <button onClick={() => navigate('/')}
                        className="w-9 h-9 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: '#1A1D27',
                                 border: '1px solid #2E3148' }}>
                        <ArrowLeft size={16} color="#F1F5F9" />
                    </button>
                    <h1 className="text-base font-semibold"
                        style={{ color: '#F1F5F9' }}>
                        My Orders
                    </h1>
                </div>
            </div>

            <div className="max-w-lg mx-auto px-4 py-4 space-y-3">

                {/* New Order Token Banner */}
                {newOrder && (
                    <div className="p-4 rounded-2xl"
                        style={{ backgroundColor: '#0D2B1F',
                                 border: '1px solid #10B981' }}>
                        <p className="text-sm font-semibold mb-1"
                            style={{ color: '#10B981' }}>
                            Order Placed Successfully!
                        </p>
                        <p className="text-xs mb-2"
                            style={{ color: '#94A3B8' }}>
                            Show this token at the shop for pickup
                        </p>
                        <div className="flex items-center justify-center py-3 rounded-xl"
                            style={{ backgroundColor: '#0F1117' }}>
                            <span className="text-3xl font-bold tracking-widest"
                                style={{ color: '#10B981' }}>
                                #{newOrder.pickupToken}
                            </span>
                        </div>
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div className="px-4 py-3 rounded-xl text-sm"
                        style={{ backgroundColor: '#2D1515',
                                 color: '#EF4444',
                                 border: '1px solid #EF4444' }}>
                        {error}
                    </div>
                )}

                {/* Empty State */}
                {!loading && orders.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20">
                        <Package size={48} color="#2E3148" className="mb-4" />
                        <p className="text-base font-medium mb-1"
                            style={{ color: '#F1F5F9' }}>
                            No orders yet
                        </p>
                        <p className="text-sm mb-6"
                            style={{ color: '#64748B' }}>
                            Find a nearby print shop and place your first order
                        </p>
                        <button
                            onClick={() => navigate('/')}
                            className="px-6 py-2.5 rounded-xl text-sm font-medium"
                            style={{ backgroundColor: '#10B981', color: '#fff' }}>
                            Find Print Shops
                        </button>
                    </div>
                )}

                {/* Orders List */}
                {orders.map((order) => {
                    const status = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending
                    const StatusIcon = status.icon

                    return (
                        <div key={order._id}
                            onClick={() => navigate(`/order/${order._id}`)}
                            className="p-4 rounded-2xl cursor-pointer active:scale-95 
                                       transition-transform"
                            style={{ backgroundColor: '#1A1D27',
                                     border: '1px solid #2E3148' }}>

                            {/* Top Row */}
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-mono font-bold"
                                        style={{ color: '#64748B' }}>
                                        #{order.pickupToken}
                                    </span>
                                </div>

                                {/* Status Badge */}
                                <div className="flex items-center gap-1.5 px-2.5 py-1 
                                                rounded-full"
                                    style={{ backgroundColor: status.bg }}>
                                    <StatusIcon size={11} color={status.color} />
                                    <span className="text-xs font-medium"
                                        style={{ color: status.color }}>
                                        {status.label}
                                    </span>
                                </div>
                            </div>

                            {/* File Name */}
                            <p className="text-sm font-medium mb-2 truncate"
                                style={{ color: '#F1F5F9' }}>
                                {order.fileName}
                            </p>

                            {/* Print Config */}
                            <div className="flex items-center gap-2 mb-3">
                                <span className="text-xs px-2 py-1 rounded-lg"
                                    style={{ backgroundColor: '#222536',
                                             color: '#94A3B8' }}>
                                    {order.printConfig?.paperSize}
                                </span>
                                <span className="text-xs px-2 py-1 rounded-lg"
                                    style={{ backgroundColor: '#222536',
                                             color: '#94A3B8' }}>
                                    {order.printConfig?.copies} {order.printConfig?.copies > 1 ? 'copies' : 'copy'}
                                </span>
                                <span className="text-xs px-2 py-1 rounded-lg"
                                    style={{ backgroundColor: '#222536',
                                             color: '#94A3B8' }}>
                                    {order.pageCount} pages
                                </span>
                            </div>

                            {/* Bottom Row */}
                            <div className="flex items-center justify-between">
                                <span className="text-xs"
                                    style={{ color: '#64748B' }}>
                                    {new Date(order.createdAt).toLocaleDateString('en-IN', {
                                        day: 'numeric',
                                        month: 'short',
                                        year: 'numeric'
                                    })}
                                </span>
                                <span className="text-sm font-bold"
                                    style={{ color: '#10B981' }}>
                                    ₹{order.totalAmount}
                                </span>
                            </div>

                        </div>
                    )
                })}

            </div>
           

        </div>
    )
}

export default MyOrders