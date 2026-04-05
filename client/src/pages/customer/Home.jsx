import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, Search, RefreshCw, SlidersHorizontal, Plus, Filter } from 'lucide-react'
import { useAuth } from '../../context/AuthContext.jsx'
import VendorCard from './VendorCard.jsx'
import Loader from '../../components/common/Loader.jsx'
import { VendorCardSkeleton } from '../../components/common/Skeleton.jsx'
import api from '../../utils/axios.js'

/**
 * Home Screen - Customer Discovery
 * 
 * API Endpoint: GET /api/vendor/nearby-vendor
 * Response: Array of Vendor objects with:
 *   - _id, shopName, address, city, pincode
 *   - location: { type: 'Point', coordinates: [lng, lat] }
 *   - shopPhoto, isOpen, pricing: [{paperSize, printType, pricePerPage}]
 *   - averageRating, ratings: [{customerId, score, review}]
 */
const Home = () => {
    const [vendors, setVendors] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [userLocation, setUserLocation] = useState(null)

    const { user } = useAuth()
    const navigate = useNavigate()

    useEffect(() => {
        getUserLocation()
    }, [])

    const getUserLocation = () => {
        setLoading(true)
        setError('')

        if(!navigator.geolocation){
            setError('Location not supported in this browser')
            setLoading(false)
            return
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords
                setUserLocation({ latitude, longitude })
                fetchNearbyVendors(latitude, longitude)
            },
            () => {
                setError('Allow location access to find nearby print shops')
                setLoading(false)
            }
        )
    }

    const fetchNearbyVendors = async (latitude, longitude) => {
        try {
            const res = await api.get('/vendor/nearby-vendor', {
                params: { latitude, longitude, maxDistance: 5000 }
            })
            setVendors(res.data.data)
        } catch(err) {
            setError('Could not load vendors — please try again')
        } finally {
            setLoading(false)
        }
    }

    // Frontend filtering
    const filteredVendors = vendors.filter(vendor => {
        const matchesSearch = vendor.shopName
            .toLowerCase()
            .includes(search.toLowerCase())

        const matchesStatus =
            statusFilter === 'all' ? true :
            statusFilter === 'open' ? vendor.isOpen :
            !vendor.isOpen

        return matchesSearch && matchesStatus
    })

    // Show skeleton loaders during initial load
    if (loading) {
        return (
            <div className="min-h-screen safe-area-pb" style={{ backgroundColor: '#0F172A' }}>
                {/* Header Skeleton */}
                <div className="sticky top-0 z-10 px-4 py-4 safe-area-pt glass-card border-b-0 rounded-none">
                    <div className="max-w-lg mx-auto">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <div className="w-28 h-4 rounded mb-2 shimmer" />
                                <div className="w-36 h-7 rounded shimmer" />
                            </div>
                            <div className="w-10 h-10 rounded-full shimmer" />
                        </div>
                        <div className="h-12 rounded-xl mb-3 shimmer" />
                        <div className="flex gap-2">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="w-20 h-9 rounded-xl shimmer" />
                            ))}
                        </div>
                    </div>
                </div>

                <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <VendorCardSkeleton key={i} />
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen safe-area-pb" style={{ backgroundColor: '#0F172A' }}>
            {/* Sticky Header with Glassmorphism */}
            <header className="sticky top-0 z-20 px-4 py-4 safe-area-pt"
                style={{ 
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    backdropFilter: 'blur(12px)',
                    borderBottom: '1px solid rgba(51, 65, 85, 0.5)'
                }}>
                <div className="max-w-lg mx-auto">
                    {/* Top Row - Location & Avatar */}
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <p className="text-xs font-medium" style={{ color: '#64748B' }}>
                                Nearby Print Shops
                            </p>
                            <h1 className="text-xl font-bold text-glow-primary" style={{ color: '#F1F5F9' }}>
                                XConnect
                            </h1>
                        </div>

                        {/* Avatar with glow effect */}
                        <button
                            onClick={() => navigate('/profile')}
                            className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center transition-transform active:scale-95"
                            style={{ 
                                backgroundColor: '#10B981',
                                boxShadow: '0 0 15px rgba(16, 185, 129, 0.4)'
                            }}
                        >
                            {user?.avatar ? (
                                <img src={user.avatar} alt="avatar" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-white text-sm font-bold">
                                    {user?.fullName?.[0]?.toUpperCase()}
                                </span>
                            )}
                        </button>
                    </div>

                    {/* Search Bar - Glassmorphism */}
                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl mb-3"
                        style={{ 
                            backgroundColor: 'rgba(30, 41, 59, 0.7)',
                            border: '1px solid rgba(51, 65, 85, 0.8)',
                            backdropFilter: 'blur(8px)'
                        }}>
                        <Search size={18} color="#64748B" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search for nearby print shops..."
                            className="flex-1 bg-transparent outline-none text-sm"
                            style={{ color: '#F1F5F9' }}
                        />
                        {search ? (
                            <button onClick={() => setSearch('')} className="p-1 rounded-full hover:bg-slate-700 transition-colors">
                                <RefreshCw size={14} color="#64748B" />
                            </button>
                        ) : (
                            <Filter size={18} color="#64748B" />
                        )}
                    </div>

                    {/* Status Filter Pills */}
                    <div className="flex gap-2">
                        {[
                            { key: 'all',    label: 'All Shops' },
                            { key: 'open',   label: 'Open Now' },
                            { key: 'closed', label: 'Closed' },
                        ].map(f => (
                            <button
                                key={f.key}
                                onClick={() => setStatusFilter(f.key)}
                                className="px-4 py-2 rounded-full text-xs font-semibold transition-all duration-200 active:scale-95"
                                style={{
                                    backgroundColor: statusFilter === f.key
                                        ? '#10B981' : 'rgba(30, 41, 59, 0.7)',
                                    color: statusFilter === f.key
                                        ? '#ffffff' : '#94A3B8',
                                    border: '1px solid',
                                    borderColor: statusFilter === f.key
                                        ? '#10B981' : 'rgba(51, 65, 85, 0.5)'
                                }}>
                                {f.label}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            {/* Content */}
            <main className="max-w-lg mx-auto px-4 py-4">
                {/* Error State */}
                {error && (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                            style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}>
                            <MapPin size={28} color="#EF4444" />
                        </div>
                        <p className="text-sm text-center mb-4" style={{ color: '#94A3B8' }}>
                            {error}
                        </p>
                        <button
                            onClick={getUserLocation}
                            className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all active:scale-95"
                            style={{ backgroundColor: '#10B981', color: '#fff' }}>
                            <RefreshCw size={16} />
                            Try Again
                        </button>
                    </div>
                )}

                {/* Empty State */}
                {!error && filteredVendors.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                            style={{ backgroundColor: 'rgba(100, 116, 139, 0.1)' }}>
                            <Search size={28} color="#64748B" />
                        </div>
                        <p className="text-base font-semibold mb-1" style={{ color: '#F1F5F9' }}>
                            {search ? `No results for "${search}"` : 'No shops nearby'}
                        </p>
                        <p className="text-sm text-center" style={{ color: '#64748B' }}>
                            {search
                                ? 'Try a different search term'
                                : 'No print shops found within 5km of your location'}
                        </p>
                        {search && (
                            <button
                                onClick={() => {
                                    setSearch('')
                                    setStatusFilter('all')
                                }}
                                className="mt-4 px-6 py-3 rounded-xl text-sm font-semibold transition-all active:scale-95"
                                style={{ backgroundColor: '#10B981', color: '#fff' }}>
                                Clear Search
                            </button>
                        )}
                    </div>
                )}

                {/* Vendor List */}
                {!error && filteredVendors.length > 0 && (
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-sm font-medium" style={{ color: '#64748B' }}>
                                {filteredVendors.length} {filteredVendors.length === 1 ? 'shop' : 'shops'} nearby
                                {search && <span style={{ color: '#94A3B8' }}> for "{search}"</span>}
                            </p>
                            {userLocation && (
                                <p className="text-xs" style={{ color: '#64748B' }}>
                                    Within 5km
                                </p>
                            )}
                        </div>
                        <div className="space-y-4">
                            {filteredVendors.map(vendor => (
                                <VendorCard key={vendor._id} vendor={vendor} />
                            ))}
                        </div>
                    </div>
                )}
            </main>

            {/* Floating Action Button - Create Order */}
            <button
                onClick={() => navigate('/my-orders')}
                className="fixed bottom-24 right-6 w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 active:scale-90 hover:scale-105 z-30"
                style={{ 
                    backgroundColor: '#10B981',
                    boxShadow: '0 4px 20px rgba(16, 185, 129, 0.4)'
                }}
            >
                <Plus size={28} color="#ffffff" strokeWidth={2.5} />
            </button>
        </div>
    )
}

export default Home