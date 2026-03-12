import { useNavigate } from 'react-router-dom'
import StatusBadge from '../../components/common/StatusBadge.jsx'

const OrderCard = ({ order }) => {
    const navigate = useNavigate()

    return (
        <div
            onClick={() => navigate(`/order/${order._id}`)}
            className="p-4 rounded-2xl cursor-pointer active:scale-95 
                       transition-transform"
            style={{ backgroundColor: '#1A1D27',
                     border: '1px solid #2E3148' }}>

            {/* Top Row */}
            <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono font-bold"
                    style={{ color: '#64748B' }}>
                    #{order.pickupToken}
                </span>
                <StatusBadge status={order.status} size="sm" />
            </div>

            {/* File Name */}
            <p className="text-sm font-medium truncate mb-2"
                style={{ color: '#F1F5F9' }}>
                {order.fileName}
            </p>

            {/* Tags */}
            <div className="flex items-center gap-2 mb-3">
                {[
                    order.printConfig?.paperSize,
                    `${order.pageCount} pages`,
                    `${order.printConfig?.copies} ${order.printConfig?.copies > 1
                        ? 'copies' : 'copy'}`,
                ].map((tag, i) => (
                    <span key={i}
                        className="text-xs px-2 py-1 rounded-lg"
                        style={{ backgroundColor: '#222536',
                                 color: '#94A3B8' }}>
                        {tag}
                    </span>
                ))}
            </div>

            {/* Bottom Row */}
            <div className="flex items-center justify-between">
                <span className="text-xs"
                    style={{ color: '#64748B' }}>
                    {new Date(order.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', year: 'numeric'
                    })}
                </span>
                <span className="text-sm font-bold"
                    style={{ color: '#10B981' }}>
                    ₹{order.totalAmount}
                </span>
            </div>

        </div>
    )
}

export default OrderCard