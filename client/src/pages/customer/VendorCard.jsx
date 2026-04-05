import { useNavigate } from 'react-router-dom'
import { MapPin, Star, Clock, Navigation } from 'lucide-react'

/**
 * VendorCard Component
 * 
 * Props:
 *   - vendor: Vendor object from GET /api/vendor/nearby-vendor
 *     {
 *       _id: string,
 *       shopName: string,
 *       shopPhoto: string | null,
 *       address: string,
 *       city: string,
 *       isOpen: boolean,
 *       averageRating: number,
 *       ratings: Array,
 *       pricing: [{ paperSize, printType, pricePerPage }],
 *       distance?: number  // Calculated on backend
 *     }
 */
const VendorCard = ({ vendor }) => {
    const navigate = useNavigate()

    // Calculate minimum price from vendor pricing
    const getMinPrice = () => {
        if (!vendor.pricing?.length) return null
        return Math.min(...vendor.pricing.map(p => p.pricePerPage))
    }

    const minPrice = getMinPrice()

    return (
        <div
            onClick={() => navigate(`/vendor/${vendor._id}`)}
            className="glass-card p-4 cursor-pointer transition-all duration-200 active:scale-[0.98] hover:border-emerald-500/30 group"
        >
            <div className="flex gap-4">
                {/* Shop Photo - 80x80px as per design spec */}
                <div 
                    className="w-20 h-20 rounded-xl flex-shrink-0 overflow-hidden flex items-center justify-center"
                    style={{ backgroundColor: 'rgba(30, 41, 59, 0.8)' }}
                >
                    {vendor.shopPhoto ? (
                        <img 
                            src={vendor.shopPhoto}
                            alt={vendor.shopName}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                    ) : (
                        <span className="text-3xl">🖨️</span>
                    )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                    {/* Top Row - Shop Name & Status */}
                    <div className="flex items-start justify-between gap-2">
                        <h3 
                            className="font-semibold text-base truncate"
                            style={{ color: '#F1F5F9' }}
                        >
                            {vendor.shopName}
                        </h3>
                        
                        {/* Status Badge with pulse for open shops */}
                        {vendor.isOpen ? (
                            <span 
                                className="text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1 flex-shrink-0 animate-pulse-glow"
                                style={{
                                    backgroundColor: 'rgba(16, 185, 129, 0.15)',
                                    color: '#10B981',
                                    border: '1px solid rgba(16, 185, 129, 0.3)'
                                }}
                            >
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                Ready in 10m
                            </span>
                        ) : (
                            <span 
                                className="text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0"
                                style={{
                                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                    color: '#EF4444',
                                    border: '1px solid rgba(239, 68, 68, 0.2)'
                                }}
                            >
                                Closed
                            </span>
                        )}
                    </div>

                    {/* Middle Row - Address & Distance */}
                    <div className="flex items-center gap-1 mt-1">
                        <MapPin size={12} color="#64748B" />
                        <p className="text-xs truncate" style={{ color: '#64748B' }}>
                            {vendor.address}, {vendor.city}
                        </p>
                        {vendor.distance && (
                            <>
                                <span style={{ color: '#334155' }}>•</span>
                                <Navigation size={10} color="#10B981" />
                                <span className="text-xs font-medium" style={{ color: '#10B981' }}>
                                    {(vendor.distance / 1000).toFixed(1)}km
                                </span>
                            </>
                        )}
                    </div>

                    {/* Bottom Row - Rating & Price */}
                    <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-1.5">
                            <div className="flex items-center gap-1">
                                <Star size={12} color="#F59E0B" fill="#F59E0B" />
                                <span className="text-xs font-semibold" style={{ color: '#F1F5F9' }}>
                                    {vendor.averageRating > 0
                                        ? vendor.averageRating.toFixed(1)
                                        : 'New'}
                                </span>
                            </div>
                            {vendor.ratings?.length > 0 && (
                                <span className="text-xs" style={{ color: '#64748B' }}>
                                    ({vendor.ratings.length})
                                </span>
                            )}
                        </div>

                        {/* Starting Price */}
                        {minPrice && (
                            <span 
                                className="text-xs font-semibold"
                                style={{ color: '#10B981' }}
                            >
                                Starting ₹{minPrice}/pg
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default VendorCard