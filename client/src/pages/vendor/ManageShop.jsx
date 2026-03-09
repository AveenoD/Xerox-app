import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
    ArrowLeft, Store, MapPin, 
    Image, Plus, Trash2, Save
} from 'lucide-react'
import api from '../../utils/axios.js'
import Loader from '../../components/common/Loader.jsx'

const PAPER_SIZES = ['A4', 'A3', 'Legal']
const PRINT_TYPES = [
    { value: 'bw_single',    label: 'B&W Single Side' },
    { value: 'bw_double',    label: 'B&W Double Side' },
    { value: 'color_single', label: 'Color Single Side' },
    { value: 'color_double', label: 'Color Double Side' },
]

const ManageShop = () => {
    const [vendor, setVendor] = useState(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [pricingSaving, setPricingSaving] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    const [formData, setFormData] = useState({
        shopName: '',
        address: '',
        city: '',
        pincode: '',
    })
    const [shopPhoto, setShopPhoto] = useState(null)
    const [pricing, setPricing] = useState([])
    const [newPricing, setNewPricing] = useState({
        paperSize: 'A4',
        printType: 'bw_single',
        pricePerPage: ''
    })

    const navigate = useNavigate()

    useEffect(() => {
        fetchVendor()
    }, [])

    const fetchVendor = async () => {
        try {
            const res = await api.get('/vendor/profile/me')
            const v = res.data.data
            setVendor(v)
            setFormData({
                shopName: v.shopName || '',
                address: v.address || '',
                city: v.city || '',
                pincode: v.pincode || '',
            })
            setPricing(v.pricing || [])
        } catch(err) {
            setError('Could not load shop details')
        } finally {
            setLoading(false)
        }
    }

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleUpdateShop = async () => {
        setSaving(true)
        setError('')
        setSuccess('')
        try {
            const data = new FormData()
            data.append('shopName', formData.shopName)
            data.append('address', formData.address)
            data.append('city', formData.city)
            data.append('pincode', formData.pincode)
            if(shopPhoto) data.append('shopPhoto', shopPhoto)

            await api.put('/vendor/profile/update', data)
            setSuccess('Shop details updated successfully!')
        } catch(err) {
            setError(err.response?.data?.message || 'Update failed')
        } finally {
            setSaving(false)
        }
    }

    const handleAddPricing = () => {
        if(!newPricing.pricePerPage) return setError('Please enter a price')

        // Duplicate check
        const exists = pricing.find(
            p => p.paperSize === newPricing.paperSize &&
                 p.printType === newPricing.printType
        )
        if(exists) return setError('This paper size + print type already exists')

        setPricing([...pricing, {
            paperSize: newPricing.paperSize,
            printType: newPricing.printType,
            pricePerPage: parseFloat(newPricing.pricePerPage)
        }])
        setNewPricing({ paperSize: 'A4', printType: 'bw_single', pricePerPage: '' })
        setError('')
    }

    const handleRemovePricing = (index) => {
        setPricing(pricing.filter((_, i) => i !== index))
    }

    const handleSavePricing = async () => {
        setPricingSaving(true)
        setError('')
        setSuccess('')
        try {
            await api.put('/vendor/update-pricing', { pricing })
            setSuccess('Pricing updated successfully!')
        } catch(err) {
            setError(err.response?.data?.message || 'Pricing update failed')
        } finally {
            setPricingSaving(false)
        }
    }

    const getPrintLabel = (printType) => {
        return PRINT_TYPES.find(t => t.value === printType)?.label || printType
    }

    if(loading) return <Loader />

    return (
        <div className="min-h-screen pb-24"
            style={{ backgroundColor: '#0F1117' }}>

            {/* Header */}
            <div className="sticky top-0 z-10 px-4 py-4"
                style={{ backgroundColor: '#0F1117',
                         borderBottom: '1px solid #2E3148' }}>
                <div className="max-w-lg mx-auto flex items-center gap-3">
                    <button onClick={() => navigate('/dashboard')}
                        className="w-9 h-9 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: '#1A1D27',
                                 border: '1px solid #2E3148' }}>
                        <ArrowLeft size={16} color="#F1F5F9" />
                    </button>
                    <div>
                        <h1 className="text-base font-semibold"
                            style={{ color: '#F1F5F9' }}>
                            Manage Shop
                        </h1>
                        <p className="text-xs" style={{ color: '#64748B' }}>
                            {vendor?.shopName}
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

                {/* Success */}
                {success && (
                    <div className="px-4 py-3 rounded-xl text-sm"
                        style={{ backgroundColor: '#0D2B1F',
                                 color: '#10B981',
                                 border: '1px solid #10B981' }}>
                        {success}
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
                                maxLength={6}
                                className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                                style={{
                                    backgroundColor: '#222536',
                                    border: '1px solid #2E3148',
                                    color: '#F1F5F9'
                                }}
                            />
                        </div>
                    </div>

                    {/* Shop Photo */}
                    <div>
                        <label className="block text-xs mb-1.5"
                            style={{ color: '#94A3B8' }}>
                            Shop Photo
                            <span style={{ color: '#64748B' }}> (optional)</span>
                        </label>
                        <label className="flex items-center gap-3 px-4 py-3 
                                          rounded-xl cursor-pointer"
                            style={{
                                backgroundColor: '#222536',
                                border: shopPhoto
                                    ? '1px solid #10B981'
                                    : '1px solid #2E3148'
                            }}>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => setShopPhoto(e.target.files[0])}
                                className="hidden"
                            />
                            <Image size={16} color={shopPhoto ? '#10B981' : '#64748B'} />
                            <span className="text-sm"
                                style={{ color: shopPhoto ? '#10B981' : '#64748B' }}>
                                {shopPhoto ? shopPhoto.name : 'Change shop photo'}
                            </span>
                        </label>
                    </div>

                    {/* Save Button */}
                    <button
                        onClick={handleUpdateShop}
                        disabled={saving}
                        className="w-full py-3 rounded-xl text-sm font-semibold
                                   flex items-center justify-center gap-2"
                        style={{
                            backgroundColor: '#10B981',
                            color: '#ffffff',
                            opacity: saving ? 0.6 : 1
                        }}>
                        <Save size={15} />
                        {saving ? 'Saving...' : 'Save Shop Details'}
                    </button>
                </div>

                {/* Pricing Management */}
                <div className="p-4 rounded-2xl space-y-4"
                    style={{ backgroundColor: '#1A1D27',
                             border: '1px solid #2E3148' }}>

                    <p className="text-sm font-semibold"
                        style={{ color: '#F1F5F9' }}>
                        Pricing
                    </p>

                    {/* Current Pricing List */}
                    {pricing.length === 0 ? (
                        <p className="text-sm" style={{ color: '#64748B' }}>
                            No pricing set — add your first price below
                        </p>
                    ) : (
                        <div className="space-y-2">
                            {pricing.map((p, index) => (
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
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm font-bold"
                                            style={{ color: '#10B981' }}>
                                            ₹{p.pricePerPage}/page
                                        </span>
                                        <button
                                            onClick={() => handleRemovePricing(index)}>
                                            <Trash2 size={15} color="#EF4444" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Add New Pricing */}
                    <div className="p-3 rounded-xl space-y-3"
                        style={{ backgroundColor: '#222536' }}>

                        <p className="text-xs font-medium"
                            style={{ color: '#94A3B8' }}>
                            Add New Price
                        </p>

                        {/* Paper Size */}
                        <div className="flex gap-2">
                            {PAPER_SIZES.map(size => (
                                <button
                                    key={size}
                                    onClick={() => setNewPricing(
                                        prev => ({ ...prev, paperSize: size })
                                    )}
                                    className="flex-1 py-2 rounded-lg text-xs font-medium"
                                    style={{
                                        backgroundColor: newPricing.paperSize === size
                                            ? '#10B981' : '#1A1D27',
                                        color: newPricing.paperSize === size
                                            ? '#ffffff' : '#94A3B8',
                                        border: '1px solid',
                                        borderColor: newPricing.paperSize === size
                                            ? '#10B981' : '#2E3148'
                                    }}>
                                    {size}
                                </button>
                            ))}
                        </div>

                        {/* Print Type */}
                        <select
                            value={newPricing.printType}
                            onChange={(e) => setNewPricing(
                                prev => ({ ...prev, printType: e.target.value })
                            )}
                            className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
                            style={{
                                backgroundColor: '#1A1D27',
                                border: '1px solid #2E3148',
                                color: '#F1F5F9'
                            }}>
                            {PRINT_TYPES.map(t => (
                                <option key={t.value} value={t.value}>
                                    {t.label}
                                </option>
                            ))}
                        </select>

                        {/* Price Input + Add Button */}
                        <div className="flex gap-2">
                            <input
                                type="number"
                                min={0}
                                step={0.5}
                                value={newPricing.pricePerPage}
                                onChange={(e) => setNewPricing(
                                    prev => ({
                                        ...prev,
                                        pricePerPage: e.target.value
                                    })
                                )}
                                placeholder="Price per page (₹)"
                                className="flex-1 px-3 py-2.5 rounded-lg text-sm outline-none"
                                style={{
                                    backgroundColor: '#1A1D27',
                                    border: '1px solid #2E3148',
                                    color: '#F1F5F9'
                                }}
                            />
                            <button
                                onClick={handleAddPricing}
                                className="px-4 py-2.5 rounded-lg text-sm 
                                           font-medium flex items-center gap-1"
                                style={{
                                    backgroundColor: '#10B981',
                                    color: '#ffffff'
                                }}>
                                <Plus size={15} />
                                Add
                            </button>
                        </div>
                    </div>

                    {/* Save Pricing */}
                    {pricing.length > 0 && (
                        <button
                            onClick={handleSavePricing}
                            disabled={pricingSaving}
                            className="w-full py-3 rounded-xl text-sm font-semibold
                                       flex items-center justify-center gap-2"
                            style={{
                                backgroundColor: '#10B981',
                                color: '#ffffff',
                                opacity: pricingSaving ? 0.6 : 1
                            }}>
                            <Save size={15} />
                            {pricingSaving ? 'Saving...' : 'Save Pricing'}
                        </button>
                    )}
                </div>

            </div>
        </div>
    )
}

export default ManageShop