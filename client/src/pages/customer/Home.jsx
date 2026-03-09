import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import api from '../../utils/axios.js'
import Loader from '../../components/common/Loader.jsx'

const Home = () => {
  const [vendors, setVendors] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [location, setLocation] = useState(null)

  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    getUserLocation()
  }, [])

  const getUserLocation = () => {
    if (!navigator.geolocation) {
      setError('Location supported nahi hai is browser mein')
      setLoading(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        setLocation({ latitude, longitude })
        fetchNearbyVendors(latitude, longitude)
      },
      (err) => {
        setError('Location access do — nearby vendors dekhne ke liye')
        setLoading(false)
      }
    )
  }

  const fetchNearbyVendors = async (latitude, longitude) => {
    try {
      console.log('Fetching vendors:', latitude, longitude) // ← add karo
      const res = await api.get('/vendor/nearby-vendor', {
        params: { latitude, longitude, maxDistance: 5000 }
      })
      console.log('Vendors response:', res.data) // ← add karo
      setVendors(res.data.data)
    } catch (err) {
      console.log('Error:', err.response?.data) // ← add karo
      setError('Could not load vendors')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0F1117' }}>

      {/* Header */}
      <div className="sticky top-0 z-10 px-4 py-4"
        style={{
          backgroundColor: '#0F1117',
          borderBottom: '1px solid #2E3148'
        }}>
        <div className="max-w-lg mx-auto">

          {/* Top Row */}
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs" style={{ color: '#64748B' }}>
                Nearby Print Shops
              </p>
              <h1 className="text-lg font-bold"
                style={{ color: '#F1F5F9' }}>
                XConnect
              </h1>
            </div>

            {/* Avatar */}
            <div className="w-9 h-9 rounded-full flex items-center 
                                        justify-center cursor-pointer"
              style={{ backgroundColor: '#10B981' }}
              onClick={() => navigate('/profile')}>
              <span className="text-white text-sm font-bold">
                {user?.fullName?.[0]?.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Search Bar — UI only abhi */}
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl"
            style={{
              backgroundColor: '#1A1D27',
              border: '1px solid #2E3148'
            }}>
            <span style={{ color: '#64748B' }}>🔍</span>
            <span className="text-sm" style={{ color: '#64748B' }}>
              Search print shops...
            </span>
          </div>

        </div>
      </div>

      {/* Content */}
      <div className="max-w-lg mx-auto px-4 py-4">

        {/* Loading */}
        {loading && (
          <Loader />
        )}

        {/* Error */}
        {error && !loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="text-4xl mb-3">📍</div>
            <p className="text-sm text-center mb-4"
              style={{ color: '#94A3B8' }}>
              {error}
            </p>
            <button
              onClick={getUserLocation}
              className="px-6 py-2.5 rounded-xl text-sm font-medium"
              style={{ backgroundColor: '#10B981', color: '#fff' }}>
              Try Again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && vendors.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="text-4xl mb-3">🖨️</div>
            <p className="text-base font-medium mb-1"
              style={{ color: '#F1F5F9' }}>
              No shops nearby
            </p>
            <p className="text-sm text-center"
              style={{ color: '#64748B' }}>
              5km radius mein koi print shop nahi mila
            </p>
          </div>
        )}

        {/* Vendor List */}
        {!loading && !error && vendors.length > 0 && (
          <div>
            <p className="text-sm mb-3"
              style={{ color: '#64748B' }}>
              {vendors.length} shops found nearby
            </p>

            <div className="space-y-3">
              {vendors.map((vendor) => (
                <div
                  key={vendor._id}
                  onClick={() => navigate(`/vendor/${vendor._id}`)}
                  className="p-4 rounded-2xl cursor-pointer 
                                               active:scale-95 transition-transform"
                  style={{
                    backgroundColor: '#1A1D27',
                    border: '1px solid #2E3148'
                  }}>

                  {/* Shop Photo + Info */}
                  <div className="flex gap-3">

                    {/* Photo */}
                    <div className="w-16 h-16 rounded-xl flex-shrink-0
                                                        overflow-hidden flex items-center 
                                                        justify-center"
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
                      <div className="flex items-center 
                                                            justify-between mb-1">
                        <h3 className="font-semibold text-sm truncate"
                          style={{ color: '#F1F5F9' }}>
                          {vendor.shopName}
                        </h3>

                        {/* Open/Closed Badge */}
                        <span className="text-xs px-2 py-0.5 
                                                                  rounded-full ml-2 flex-shrink-0"
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
                      <p className="text-xs truncate mb-2"
                        style={{ color: '#64748B' }}>
                        📍 {vendor.address}, {vendor.city}
                      </p>

                      {/* Rating + Starting Price */}
                      <div className="flex items-center 
                                                            justify-between">
                        <div className="flex items-center gap-1">
                          <span className="text-xs">⭐</span>
                          <span className="text-xs font-medium"
                            style={{ color: '#F1F5F9' }}>
                            {vendor.averageRating > 0
                              ? vendor.averageRating.toFixed(1)
                              : 'New'}
                          </span>
                        </div>

                        {/* Starting price */}
                        {vendor.pricing?.length > 0 && (
                          <span className="text-xs"
                            style={{ color: '#10B981' }}>
                            From ₹{Math.min(
                              ...vendor.pricing.map(
                                p => p.pricePerPage)
                            )}/page
                          </span>
                        )}
                      </div>

                    </div>
                  </div>

                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    
    </div>
  )
}

export default Home