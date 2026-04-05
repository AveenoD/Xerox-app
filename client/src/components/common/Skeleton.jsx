const Skeleton = ({ className = '', width, height, circle = false }) => {
    const style = {
        width: width || '100%',
        height: height || '1rem',
        borderRadius: circle ? '50%' : '0.5rem',
        backgroundColor: '#2E3148',
        animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
    }

    return (
        <div className={className} style={style} />
    )
}

// Vendor Card Skeleton
export const VendorCardSkeleton = () => (
    <div className="p-4 rounded-2xl"
        style={{ backgroundColor: '#1A1D27', border: '1px solid #2E3148' }}>
        <div className="flex items-start gap-3">
            <Skeleton width={64} height={64} circle />
            <div className="flex-1 min-w-0 space-y-2">
                <Skeleton width="70%" height={20} />
                <Skeleton width="50%" height={14} />
                <div className="flex items-center gap-2">
                    <Skeleton width={60} height={20} />
                    <Skeleton width={40} height={14} />
                </div>
            </div>
        </div>
    </div>
)

// Order Card Skeleton
export const OrderCardSkeleton = () => (
    <div className="p-4 rounded-2xl"
        style={{ backgroundColor: '#1A1D27', border: '1px solid #2E3148' }}>
        <div className="flex items-center justify-between mb-3">
            <Skeleton width={60} height={14} />
            <Skeleton width={50} height={20} />
        </div>
        <Skeleton width="80%" height={16} className="mb-2" />
        <div className="flex items-center gap-2 mb-3">
            <Skeleton width={50} height={20} />
            <Skeleton width={60} height={20} />
            <Skeleton width={50} height={20} />
        </div>
        <div className="flex items-center justify-between">
            <Skeleton width={80} height={14} />
            <Skeleton width={50} height={18} />
        </div>
    </div>
)

// Dashboard Order Skeleton
export const DashboardOrderSkeleton = () => (
    <div className="p-4 rounded-2xl"
        style={{ backgroundColor: '#1A1D27', border: '1px solid #2E3148' }}>
        <div className="flex items-center justify-between mb-3">
            <Skeleton width={80} height={18} />
            <Skeleton width={60} height={20} />
        </div>
        <Skeleton width="70%" height={16} className="mb-2" />
        <div className="flex items-center gap-2 mb-3">
            <Skeleton width={40} height={20} />
            <Skeleton width={70} height={20} />
            <Skeleton width={60} height={20} />
        </div>
        <div className="flex gap-2">
            <Skeleton width="50%" height={40} />
            <Skeleton width="50%" height={40} />
        </div>
    </div>
)

// Stats Skeleton
export const StatsSkeleton = () => (
    <div className="grid grid-cols-4 gap-2">
        {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-3 rounded-2xl text-center"
                style={{ backgroundColor: '#1A1D27', border: '1px solid #2E3148' }}>
                <Skeleton width={16} height={16} circle className="mx-auto mb-1" />
                <Skeleton width="60%" height={24} className="mx-auto mb-1" />
                <Skeleton width="80%" height={12} className="mx-auto" />
            </div>
        ))}
    </div>
)

export default Skeleton
