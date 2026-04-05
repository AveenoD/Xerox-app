import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Package, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react'
import OrderCard from './OrderCard.jsx'
import Loader from '../../components/common/Loader.jsx'
import { OrderCardSkeleton } from '../../components/common/Skeleton.jsx'
import usePolling from '../../hooks/usePolling.js'
import api from '../../utils/axios.js'

const ORDERS_PER_PAGE = 10

const MyOrders = () => {
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)

    const navigate = useNavigate()
    const location = useLocation()
    const newOrder = location.state?.newOrder

    const fetchOrders = async (page = currentPage) => {
        try {
            const res = await api.get('/orders/my-orders', {
                params: { page, limit: ORDERS_PER_PAGE }
            })
            setOrders(res.data.data || [])
            setTotalPages(res.data.pagination?.totalPages || 1)
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
    }, [currentPage])

    // Auto refresh every 15 seconds
    usePolling(() => fetchOrders(currentPage), 15000, !loading)

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
                    <div className="max-w-lg mx-auto">
                        <div className="w-32 h-6 rounded mb-1"
                            style={{ backgroundColor: '#2E3148' }} />
                        <div className="w-48 h-4 rounded"
                            style={{ backgroundColor: '#2E3148' }} />
                    </div>
                </div>

                <div className="max-w-lg mx-auto px-4 py-4 space-y-3">
                    {[1, 2, 3].map((i) => (
                        <OrderCardSkeleton key={i} />
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen safe-area-pb"
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

export default MyOrders