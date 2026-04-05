import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, Search, RefreshCw, SlidersHorizontal } from 'lucide-react'
import { useAuth } from '../../context/AuthContext.jsx'
import VendorCard from './VendorCard.jsx'
import Loader from '../../components/common/Loader.jsx'
import { VendorCardSkeleton } from '../../components/common/Skeleton.jsx'
import api from '../../utils/axios.js'

const Home = () => {
    const [vendors, setVendors] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')

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
            <div className="min-h-screen safe-area-pb"
                style={{ backgroundColor: '#0F1117' }}>
                {/* Header Skeleton */}
                <div className="sticky top-0 z-10 px-4 py-4"
                    style={{ backgroundColor: '#0F1117',
                             borderBottom: '1px solid #2E3148' }}>
                    <div className="max-w-lg mx-auto">
                        <div className="flex items-center justify-between mb-3">
                            <div>
                                <div className="w-24 h-4 rounded mb-1"
                                    style={{ backgroundColor: '#2E3148' }} />
                                <div className="w-32 h-6 rounded"
                                    style={{ backgroundColor: '#2E3148' }} />
                            </div>
                            <div className="w-9 h-9 rounded-full"
                                style={{ backgroundColor: '#2E3148' }} />
                        </div>
                        <div className="h-10 rounded-xl mb-2"
                            style={{ backgroundColor: '#2E3148' }} />
                        <div className="flex gap-2">
                            <div className="w-16 h-8 rounded-xl"
                                style={{ backgroundColor: '#2E3148' }} />
                            <div className="w-16 h-8 rounded-xl"
                                style={{ backgroundColor: '#2E3148' }} />
                            <div className="w-16 h-8 rounded-xl"
                                style={{ backgroundColor: '#2E3148' }} />
                        </div>
                    </div>
                </div>

                <div className="max-w-lg mx-auto px-4 py-4 space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <VendorCardSkeleton key={i} />
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

                    {/* Top Row */}
                    <div className="flex items-center justify-between mb-3">
                        <div>
                            <p className="text-xs"
                                style={{ color: '#64748B' }}>
                                Nearby Print Shops
                            </p>
                            <h1 className="text-lg font-bold"
                                style={{ color: '#F1F5F9' }}>
                                XConnect
                            </h1>
                        </div>

                        {/* Avatar */}
                        <div
                            className="w-9 h-9 rounded-full overflow-hidden 
                                       flex items-center justify-center 
                                       cursor-pointer flex-shrink-0"
                            style={{ backgroundColor: '#10B981' }}
                            onClick={() => navigate('/profile')}>
                            {user?.avatar ? (
                                <img src={user.avatar}
                                    alt="avatar"
                                    className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-white text-sm font-bold">
                                    {user?.fullName?.[0]?.toUpperCase()}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Search Bar */}
                    <div className="flex items-center gap-2 px-4 py-2.5 
                                    rounded-xl mb-2"
                        style={{ backgroundColor: '#1A1D27',
                                 border: '1px solid #2E3148' }}>
                        <Search size={15} color="#64748B" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search print shops..."
                            className="flex-1 bg-transparent outline-none text-sm"
                            style={{ color: '#F1F5F9' }}
                        />
                        {search && (
                            <button onClick={() => setSearch('')}>
                                <RefreshCw size={13} color="#64748B" />
                            </button>
                        )}
                    </div>

                    {/* Status Filter */}
                    <div className="flex gap-2">
                        {[
                            { key: 'all',    label: 'All' },
                            { key: 'open',   label: 'Open' },
                            { key: 'closed', label: 'Closed' },
                        ].map(f => (
                            <button
                                key={f.key}
                                onClick={() => setStatusFilter(f.key)}
                                className="px-3 py-1.5 rounded-xl text-xs 
                                           font-medium"
                                style={{
                                    backgroundColor: statusFilter === f.key
                                        ? '#10B981' : '#1A1D27',
                                    color: statusFilter === f.key
                                        ? '#ffffff' : '#64748B',
                                    border: '1px solid',
                                    borderColor: statusFilter === f.key
                                        ? '#10B981' : '#2E3148'
                                }}>
                                {f.label}
                            </button>
                        ))}
                    </div>

                </div>
            </div>

            {/* Content */}
            <div className="max-w-lg mx-auto px-4 py-4">

                {/* Error */}
                {error && (
                    <div className="flex flex-col items-center 
                                    justify-center py-20">
                        <MapPin size={44} color="#2E3148" className="mb-3" />
                        <p className="text-sm text-center mb-4"
                            style={{ color: '#94A3B8' }}>
                            {error}
                        </p>
                        <button
                            onClick={getUserLocation}
                            className="flex items-center gap-2 px-6 py-2.5 
                                       rounded-xl text-sm font-medium"
                            style={{ backgroundColor: '#10B981',
                                     color: '#fff' }}>
                            <RefreshCw size={14} />
                            Try Again
                        </button>
                    </div>
                )}

                {/* Empty State */}
                {!error && filteredVendors.length === 0 && (
                    <div className="flex flex-col items-center 
                                    justify-center py-20">
                        <Search size={44} color="#2E3148" className="mb-3" />
                        <p className="text-base font-medium mb-1"
                            style={{ color: '#F1F5F9' }}>
                            {search
                                ? `No results for "${search}"`
                                : 'No shops nearby'}
                        </p>
                        <p className="text-sm text-center"
                            style={{ color: '#64748B' }}>
                            {search
                                ? 'Try a different search term'
                                : 'No print shops found within 5km'}
                        </p>
                        {search && (
                            <button
                                onClick={() => {
                                    setSearch('')
                                    setStatusFilter('all')
                                }}
                                className="mt-4 px-6 py-2.5 rounded-xl 
                                           text-sm font-medium"
                                style={{ backgroundColor: '#10B981',
                                         color: '#fff' }}>
                                Clear Search
                            </button>
                        )}
                    </div>
                )}

                {/* Vendor List */}
                {!error && filteredVendors.length > 0 && (
                    <div>
                        <p className="text-sm mb-3"
                            style={{ color: '#64748B' }}>
                            {filteredVendors.length}{' '}
                            {filteredVendors.length === 1
                                ? 'shop' : 'shops'} found
                            {search && ` for "${search}"`}
                        </p>
                        <div className="space-y-3">
                            {filteredVendors.map(vendor => (
                                <VendorCard
                                    key={vendor._id}
                                    vendor={vendor}
                                />
                            ))}
                        </div>
                    </div>
                )}

            </div>
        </div>
    )
}

export default Home