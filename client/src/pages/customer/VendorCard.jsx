import { useNavigate } from 'react-router-dom'
import { MapPin, Star } from 'lucide-react'

const VendorCard = ({ vendor }) => {
    const navigate = useNavigate()

    return (
        <div
            onClick={() => navigate(`/vendor/${vendor._id}`)}
            className="p-4 rounded-2xl cursor-pointer active:scale-95 
                       transition-transform"
            style={{ backgroundColor: '#1A1D27',
                     border: '1px solid #2E3148' }}>

            <div className="flex gap-3">
                {/* Photo */}
                <div className="w-16 h-16 rounded-xl flex-shrink-0 overflow-hidden
                                flex items-center justify-center"
                    style={{ backgroundColor: '#222536' }}>
                    {vendor.shopPhoto ? (
                        <img src={vendor.shopPhoto}
                            alt={vendor.shopName}
                            className="w-full h-full object-cover" />
                    ) : (
                        <span className="text-2xl">🖨️</span>
                    )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">

                    {/* Name + Status */}
                    <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-sm truncate"
                            style={{ color: '#F1F5F9' }}>
                            {vendor.shopName}
                        </h3>
                        <span className="text-xs px-2 py-0.5 rounded-full 
                                         ml-2 flex-shrink-0"
                            style={{
                                backgroundColor: vendor.isOpen
                                    ? '#0D2B1F' : '#2D1515',
                                color: vendor.isOpen
                                    ? '#10B981' : '#EF4444'
                            }}>
                            {vendor.isOpen ? 'Open' : 'Closed'}
                        </span>
                    </div>

                    {/* Address */}
                    <div className="flex items-center gap-1 mb-2">
                        <MapPin size={11} color="#64748B" />
                        <p className="text-xs truncate"
                            style={{ color: '#64748B' }}>
                            {vendor.address}, {vendor.city}
                        </p>
                    </div>

                    {/* Rating + Price */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                            <Star size={11} color="#EAB308" fill="#EAB308" />
                            <span className="text-xs font-medium"
                                style={{ color: '#F1F5F9' }}>
                                {vendor.averageRating > 0
                                    ? vendor.averageRating.toFixed(1)
                                    : 'New'}
                            </span>
                            <span className="text-xs"
                                style={{ color: '#64748B' }}>
                                ({vendor.ratings?.length || 0})
                            </span>
                        </div>

                        {vendor.pricing?.length > 0 && (
                            <span className="text-xs"
                                style={{ color: '#10B981' }}>
                                From ₹{Math.min(
                                    ...vendor.pricing.map(p => p.pricePerPage)
                                )}/page
                            </span>
                        )}
                    </div>

                </div>
            </div>
        </div>
    )
}

export default VendorCard