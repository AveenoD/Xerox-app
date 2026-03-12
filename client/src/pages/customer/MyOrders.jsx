import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Package, CheckCircle } from 'lucide-react'
import OrderCard from './OrderCard.jsx'
import Loader from '../../components/common/Loader.jsx'
import usePolling from '../../hooks/usePolling.js'
import api from '../../utils/axios.js'

const MyOrders = () => {
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    const navigate = useNavigate()
    const location = useLocation()
    const newOrder = location.state?.newOrder

    const fetchOrders = async () => {
        try {
            const res = await api.get('/orders/my-orders')
            setOrders(res.data.data)
        } catch(err) {
            if(err.response?.status === 400){
                setOrders([])
            } else {
                setError('Could not load orders')
            }
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchOrders()
    }, [])

    // Auto refresh every 15 seconds
    usePolling(fetchOrders, 15000, !loading)

    if(loading) return <Loader />

    return (
        <div className="min-h-screen pb-24"
            style={{ backgroundColor: '#0F1117' }}>

            {/* Header */}
            <div className="sticky top-0 z-10 px-4 py-4"
                style={{ backgroundColor: '#0F1117',
                         borderBottom: '1px solid #2E3148' }}>
                <div className="max-w-lg mx-auto">
                    <h1 className="text-base font-semibold"
                        style={{ color: '#F1F5F9' }}>
                        My Orders
                    </h1>
                    <p className="text-xs mt-0.5"
                        style={{ color: '#64748B' }}>
                        Updates every 15 seconds
                    </p>
                </div>
            </div>

            <div className="max-w-lg mx-auto px-4 py-4 space-y-3">

                {/* New Order Token Banner */}
                {newOrder && (
                    <div className="p-4 rounded-2xl"
                        style={{ backgroundColor: '#0D2B1F',
                                 border: '1px solid #10B981' }}>
                        <div className="flex items-center gap-2 mb-2">
                            <CheckCircle size={16} color="#10B981" />
                            <p className="text-sm font-semibold"
                                style={{ color: '#10B981' }}>
                                Order Placed Successfully!
                            </p>
                        </div>
                        <p className="text-xs mb-3"
                            style={{ color: '#94A3B8' }}>
                            Show this token at the shop for pickup
                        </p>
                        <div className="flex items-center justify-center 
                                        py-3 rounded-xl"
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
                {orders.length === 0 && (
                    <div className="flex flex-col items-center 
                                    justify-center py-20">
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
                            style={{ backgroundColor: '#10B981',
                                     color: '#fff' }}>
                            Find Print Shops
                        </button>
                    </div>
                )}

                {/* Orders List */}
                {orders.map(order => (
                    <OrderCard key={order._id} order={order} />
                ))}

            </div>
        </div>
    )
}

export default MyOrders