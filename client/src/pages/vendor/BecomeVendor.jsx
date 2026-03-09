import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, MapPin, Store, Image } from 'lucide-react'
import { useAuth } from '../../context/AuthContext.jsx'
import api from '../../utils/axios.js'

const BecomeVendor = () => {
    const [formData, setFormData] = useState({
        shopName: '',
        address: '',
        city: '',
        pincode: '',
    })
    const [shopPhoto, setShopPhoto] = useState(null)
    const [loading, setLoading] = useState(false)
    const [locating, setLocating] = useState(false)
    const [location, setLocation] = useState(null)
    const [error, setError] = useState('')

    const navigate = useNavigate()
    const { setUser } = useAuth()

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const getLocation = () => {
        setLocating(true)
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setLocation({
                    latitude: pos.coords.latitude,
                    longitude: pos.coords.longitude
                })
                setLocating(false)
            },
            () => {
                setError('Could not get location — please allow location access')
                setLocating(false)
            }
        )
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if(!location) return setError('Please capture your shop location')

        setLoading(true)
        setError('')

        try {
            const data = new FormData()
            data.append('shopName', formData.shopName)
            data.append('address', formData.address)
            data.append('city', formData.city)
            data.append('pincode', formData.pincode)
            data.append('latitude', location.latitude)
            data.append('longitude', location.longitude)
            if(shopPhoto) data.append('shopPhoto', shopPhoto)

            const res = await api.post('/vendor/register-vendor', data)

            // Update user role in context
            setUser(prev => ({ ...prev, role: 'vendor' }))

            navigate('/dashboard')
        } catch(err) {
            setError(err.response?.data?.message || 'Registration failed')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen pb-10"
            style={{ backgroundColor: '#0F1117' }}>

            {/* Header */}
            <div className="sticky top-0 z-10 px-4 py-4"
                style={{ backgroundColor: '#0F1117',
                         borderBottom: '1px solid #2E3148' }}>
                <div className="max-w-lg mx-auto flex items-center gap-3">
                    <button onClick={() => navigate(-1)}
                        className="w-9 h-9 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: '#1A1D27',
                                 border: '1px solid #2E3148' }}>
                        <ArrowLeft size={16} color="#F1F5F9" />
                    </button>
                    <div>
                        <h1 className="text-base font-semibold"
                            style={{ color: '#F1F5F9' }}>
                            Become a Vendor
                        </h1>
                        <p className="text-xs"
                            style={{ color: '#64748B' }}>
                            Register your print shop on XConnect
                        </p>
                    </div>
                </div>
            </div>

            <div className="max-w-lg mx-auto px-4 py-4 space-y-4">

                {/* Error */}
                {error && (
                    <div className="px-4 py-3 rounded-xl text-sm"
                        style={{ backgroundColor: '#2D1515',
                                 color: '#EF4444',
                                 border: '1px solid #EF4444' }}>
                        {error}
                    </div>
                )}

                {/* Shop Details */}
                <div className="p-4 rounded-2xl space-y-4"
                    style={{ backgroundColor: '#1A1D27',
                             border: '1px solid #2E3148' }}>

                    <div className="flex items-center gap-2">
                        <Store size={16} color="#10B981" />
                        <p className="text-sm font-semibold"
                            style={{ color: '#F1F5F9' }}>
                            Shop Details
                        </p>
                    </div>

                    {/* Shop Name */}
                    <div>
                        <label className="block text-xs mb-1.5"
                            style={{ color: '#94A3B8' }}>
                            Shop Name
                        </label>
                        <input
                            type="text"
                            name="shopName"
                            value={formData.shopName}
                            onChange={handleChange}
                            placeholder="e.g. Raj Xerox Center"
                            required
                            className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                            style={{
                                backgroundColor: '#222536',
                                border: '1px solid #2E3148',
                                color: '#F1F5F9'
                            }}
                        />
                    </div>

                    {/* Address */}
                    <div>
                        <label className="block text-xs mb-1.5"
                            style={{ color: '#94A3B8' }}>
                            Address
                        </label>
                        <input
                            type="text"
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            placeholder="e.g. Shop 12, College Road"
                            required
                            className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                            style={{
                                backgroundColor: '#222536',
                                border: '1px solid #2E3148',
                                color: '#F1F5F9'
                            }}
                        />
                    </div>

                    {/* City + Pincode */}
                    <div className="flex gap-3">
                        <div className="flex-1">
                            <label className="block text-xs mb-1.5"
                                style={{ color: '#94A3B8' }}>
                                City
                            </label>
                            <input
                                type="text"
                                name="city"
                                value={formData.city}
                                onChange={handleChange}
                                placeholder="Nashik"
                                required
                                className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                                style={{
                                    backgroundColor: '#222536',
                                    border: '1px solid #2E3148',
                                    color: '#F1F5F9'
                                }}
                            />
                        </div>
                        <div className="flex-1">
                            <label className="block text-xs mb-1.5"
                                style={{ color: '#94A3B8' }}>
                                Pincode
                            </label>
                            <input
                                type="text"
                                name="pincode"
                                value={formData.pincode}
                                onChange={handleChange}
                                placeholder="422005"
                                maxLength={6}
                                required
                                className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                                style={{
                                    backgroundColor: '#222536',
                                    border: '1px solid #2E3148',
                                    color: '#F1F5F9'
                                }}
                            />
                        </div>
                    </div>
                </div>

                {/* Shop Photo */}
                <div className="p-4 rounded-2xl"
                    style={{ backgroundColor: '#1A1D27',
                             border: '1px solid #2E3148' }}>

                    <div className="flex items-center gap-2 mb-3">
                        <Image size={16} color="#10B981" />
                        <p className="text-sm font-semibold"
                            style={{ color: '#F1F5F9' }}>
                            Shop Photo{' '}
                            <span style={{ color: '#64748B' }}>
                                (optional)
                            </span>
                        </p>
                    </div>

                    <label className="flex flex-col items-center justify-center
                                      w-full h-28 rounded-xl cursor-pointer"
                        style={{
                            backgroundColor: '#222536',
                            border: shopPhoto
                                ? '1.5px solid #10B981'
                                : '1.5px dashed #2E3148'
                        }}>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setShopPhoto(e.target.files[0])}
                            className="hidden"
                        />
                        {shopPhoto ? (
                            <div className="flex flex-col items-center gap-1">
                                <Image size={24} color="#10B981" />
                                <p className="text-sm font-medium"
                                    style={{ color: '#10B981' }}>
                                    {shopPhoto.name}
                                </p>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-1">
                                <Image size={24} color="#64748B" />
                                <p className="text-sm"
                                    style={{ color: '#64748B' }}>
                                    Upload shop photo
                                </p>
                            </div>
                        )}
                    </label>
                </div>

                {/* GPS Location */}
                <div className="p-4 rounded-2xl"
                    style={{ backgroundColor: '#1A1D27',
                             border: '1px solid #2E3148' }}>

                    <div className="flex items-center gap-2 mb-3">
                        <MapPin size={16} color="#10B981" />
                        <p className="text-sm font-semibold"
                            style={{ color: '#F1F5F9' }}>
                            Shop Location
                        </p>
                    </div>

                    {location ? (
                        <div className="px-4 py-3 rounded-xl mb-3"
                            style={{ backgroundColor: '#0D2B1F',
                                     border: '1px solid #10B981' }}>
                            <p className="text-xs font-medium mb-1"
                                style={{ color: '#10B981' }}>
                                Location captured
                            </p>
                            <p className="text-xs font-mono"
                                style={{ color: '#64748B' }}>
                                {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                            </p>
                        </div>
                    ) : (
                        <p className="text-xs mb-3"
                            style={{ color: '#64748B' }}>
                            Capture your exact shop location so customers can find you nearby
                        </p>
                    )}

                    <button
                        type="button"
                        onClick={getLocation}
                        disabled={locating}
                        className="w-full py-3 rounded-xl text-sm font-medium
                                   flex items-center justify-center gap-2"
                        style={{
                            backgroundColor: location ? '#0D2B1F' : '#222536',
                            color: location ? '#10B981' : '#94A3B8',
                            border: '1px solid',
                            borderColor: location ? '#10B981' : '#2E3148',
                            opacity: locating ? 0.6 : 1
                        }}>
                        <MapPin size={15} />
                        {locating
                            ? 'Getting location...'
                            : location
                                ? 'Recapture Location'
                                : 'Capture My Location'}
                    </button>
                </div>

                {/* Submit */}
                <button
                    onClick={handleSubmit}
                    disabled={loading || !location}
                    className="w-full py-3.5 rounded-xl font-semibold text-sm"
                    style={{
                        backgroundColor: !location ? '#222536' : '#10B981',
                        color: !location ? '#64748B' : '#ffffff',
                        opacity: loading ? 0.6 : 1,
                        cursor: !location ? 'not-allowed' : 'pointer'
                    }}>
                    {loading ? 'Registering...' : 'Register My Shop'}
                </button>

            </div>
        </div>
    )
}

export default BecomeVendor