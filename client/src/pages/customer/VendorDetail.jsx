import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../../utils/axios.js'
import Loader from '../../components/common/Loader.jsx'

const VendorDetail = () => {
    const [vendor, setVendor] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    const { vendorId } = useParams()
    const navigate = useNavigate()

    useEffect(() => {
        fetchVendor()
    }, [vendorId])

    const fetchVendor = async () => {
        try {
            const res = await api.get(`/vendor/${vendorId}`)
            setVendor(res.data.data)
        } catch(err) {
            setError('Shop details load nahi hue')
        } finally {
            setLoading(false)
        }
    }

    // Print type label readable banana
    const getPrintLabel = (printType) => {
        const labels = {
            bw_single: 'B&W Single Side',
            bw_double: 'B&W Double Side',
            color_single: 'Color Single Side',
            color_double: 'Color Double Side'
        }
        return labels[printType] || printType
    }

    if(loading) return (
        <Loader />
    )

    if(error) return (
        <div className="min-h-screen flex items-center justify-center"
            style={{ backgroundColor: '#0F1117' }}>
            <div className="text-center">
                <p className="text-sm mb-4" style={{ color: '#94A3B8' }}>
                    {error}
                </p>
                <button onClick={() => navigate(-1)}
                    className="px-6 py-2.5 rounded-xl text-sm font-medium"
                    style={{ backgroundColor: '#10B981', color: '#fff' }}>
                    Go Back
                </button>
            </div>
        </div>
    )

    return (
        <div className="min-h-screen pb-28"
            style={{ backgroundColor: '#0F1117' }}>

            {/* Header */}
            <div className="sticky top-0 z-10 px-4 py-4"
                style={{ backgroundColor: '#0F1117',
                         borderBottom: '1px solid #2E3148' }}>
                <div className="max-w-lg mx-auto flex items-center gap-3">
                    <button onClick={() => navigate(-1)}
                        className="w-9 h-9 rounded-xl flex items-center 
                                   justify-center"
                        style={{ backgroundColor: '#1A1D27',
                                 border: '1px solid #2E3148' }}>
                        <span style={{ color: '#F1F5F9' }}>←</span>
                    </button>
                    <h1 className="text-base font-semibold"
                        style={{ color: '#F1F5F9' }}>
                        Shop Details
                    </h1>
                </div>
            </div>

            <div className="max-w-lg mx-auto px-4 py-4 space-y-4">

                {/* Shop Card */}
                <div className="p-4 rounded-2xl"
                    style={{ backgroundColor: '#1A1D27',
                             border: '1px solid #2E3148' }}>

                    {/* Shop Photo */}
                    <div className="w-full h-40 rounded-xl overflow-hidden 
                                    mb-4 flex items-center justify-center"
                        style={{ backgroundColor: '#222536' }}>
                        {vendor.shopPhoto ? (
                            <img src={vendor.shopPhoto}
                                alt={vendor.shopName}
                                className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-5xl">🖨️</span>
                        )}
                    </div>

                    {/* Shop Info */}
                    <div className="flex items-start justify-between mb-3">
                        <div>
                            <h2 className="text-lg font-bold mb-1"
                                style={{ color: '#F1F5F9' }}>
                                {vendor.shopName}
                            </h2>
                            <p className="text-sm"
                                style={{ color: '#64748B' }}>
                                📍 {vendor.address}, {vendor.city} — {vendor.pincode}
                            </p>
                        </div>

                        {/* Open/Closed */}
                        <span className="text-xs px-3 py-1 rounded-full font-medium"
                            style={{
                                backgroundColor: vendor.isOpen ? '#0D2B1F' : '#2D1515',
                                color: vendor.isOpen ? '#10B981' : '#EF4444'
                            }}>
                            {vendor.isOpen ? '● Open' : '● Closed'}
                        </span>
                    </div>

                    {/* Rating */}
                    <div className="flex items-center gap-2">
                        <span className="text-sm">⭐</span>
                        <span className="text-sm font-medium"
                            style={{ color: '#F1F5F9' }}>
                            {vendor.averageRating > 0
                                ? vendor.averageRating.toFixed(1)
                                : 'No ratings yet'}
                        </span>
                        <span className="text-sm"
                            style={{ color: '#64748B' }}>
                            ({vendor.ratings?.length || 0} reviews)
                        </span>
                    </div>

                </div>

                {/* Pricing Table */}
                <div className="p-4 rounded-2xl"
                    style={{ backgroundColor: '#1A1D27',
                             border: '1px solid #2E3148' }}>

                    <h3 className="text-sm font-semibold mb-3"
                        style={{ color: '#F1F5F9' }}>
                        Pricing
                    </h3>

                    {vendor.pricing?.length === 0 ? (
                        <p className="text-sm" style={{ color: '#64748B' }}>
                            Pricing not set yet
                        </p>
                    ) : (
                        <div className="space-y-2">
                            {vendor.pricing.map((p, index) => (
                                <div key={index}
                                    className="flex items-center justify-between
                                               px-3 py-2.5 rounded-xl"
                                    style={{ backgroundColor: '#222536' }}>
                                    <div>
                                        <p className="text-sm font-medium"
                                            style={{ color: '#F1F5F9' }}>
                                            {getPrintLabel(p.printType)}
                                        </p>
                                        <p className="text-xs mt-0.5"
                                            style={{ color: '#64748B' }}>
                                            {p.paperSize}
                                        </p>
                                    </div>
                                    <span className="text-sm font-bold"
                                        style={{ color: '#10B981' }}>
                                        ₹{p.pricePerPage}/page
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Reviews */}
                {vendor.ratings?.length > 0 && (
                    <div className="p-4 rounded-2xl"
                        style={{ backgroundColor: '#1A1D27',
                                 border: '1px solid #2E3148' }}>

                        <h3 className="text-sm font-semibold mb-3"
                            style={{ color: '#F1F5F9' }}>
                            Reviews
                        </h3>

                        <div className="space-y-3">
                            {vendor.ratings.slice(0, 3).map((r, index) => (
                                <div key={index} className="pb-3"
                                    style={{ borderBottom: index < 2
                                        ? '1px solid #2E3148' : 'none' }}>
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="w-6 h-6 rounded-full 
                                                        flex items-center justify-center"
                                            style={{ backgroundColor: '#10B981' }}>
                                            <span className="text-xs text-white 
                                                             font-bold">
                                                U
                                            </span>
                                        </div>
                                        <span className="text-xs font-medium"
                                            style={{ color: '#F1F5F9' }}>
                                            {'⭐'.repeat(r.score)}
                                        </span>
                                    </div>
                                    {r.review && (
                                        <p className="text-xs ml-8"
                                            style={{ color: '#94A3B8' }}>
                                            {r.review}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

            </div>

            {/* Bottom CTA */}
            <div className="fixed bottom-0 left-0 right-0 px-4 py-4"
                style={{ backgroundColor: '#1A1D27',
                         borderTop: '1px solid #2E3148' }}>
                <div className="max-w-lg mx-auto">
                    <button
                        disabled={!vendor.isOpen}
                        onClick={() => navigate(`/create-order/${vendorId}`)}
                        className="w-full py-3.5 rounded-xl font-semibold text-sm"
                        style={{
                            backgroundColor: vendor.isOpen ? '#10B981' : '#222536',
                            color: vendor.isOpen ? '#ffffff' : '#64748B',
                            cursor: vendor.isOpen ? 'pointer' : 'not-allowed'
                        }}>
                        {vendor.isOpen ? '🖨️ Place Order' : 'Shop is Closed'}
                    </button>
                </div>
            </div>

        </div>
    )
}

export default VendorDetail