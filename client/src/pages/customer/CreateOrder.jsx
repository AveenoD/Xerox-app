import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { 
    ArrowLeft, Upload, FileText, 
    Printer, ChevronDown, ShoppingBag 
} from 'lucide-react'
import api from '../../utils/axios.js'

const PAPER_SIZES = ['A4', 'A3', 'Legal']

const PRINT_TYPES = [
    { value: 'bw_single', label: 'B&W Single Side' },
    { value: 'bw_double', label: 'B&W Double Side' },
    { value: 'color_single', label: 'Color Single Side' },
    { value: 'color_double', label: 'Color Double Side' },
]

const CreateOrder = () => {
    const [vendor, setVendor] = useState(null)
    const [file, setFile] = useState(null)
    const [pageCount, setPageCount] = useState(1)
    const [paperSize, setPaperSize] = useState('A4')
    const [printType, setPrintType] = useState('bw_single')
    const [copies, setCopies] = useState(1)
    const [paymentMethod, setPaymentMethod] = useState('cash')
    const [loading, setLoading] = useState(false)
    const [fetchLoading, setFetchLoading] = useState(true)
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
            setError('Could not load shop details')
        } finally {
            setFetchLoading(false)
        }
    }

    // Calculate price from vendor pricing
    const getPriceEntry = () => {
        if(!vendor?.pricing) return null
        return vendor.pricing.find(
            p => p.paperSize === paperSize && p.printType === printType
        )
    }

    const calculateTotal = () => {
        const priceEntry = getPriceEntry()
        if(!priceEntry) return null
        return (priceEntry.pricePerPage * pageCount * copies).toFixed(2)
    }

    const handleFileChange = (e) => {
        const selected = e.target.files[0]
        if(!selected) return
        setFile(selected)
    }

    const handleSubmit = async () => {
        if(!file) return setError('Please select a file')
        if(!getPriceEntry()) return setError('This print type is not available')

        setLoading(true)
        setError('')

        try {
            const formData = new FormData()
            formData.append('document', file)
            formData.append('vendorId', vendorId)
            formData.append('pageCount', pageCount)
            formData.append('paymentMethod', paymentMethod)
            formData.append('printConfig', JSON.stringify({
                paperSize, printType, copies
            }))

            const res = await api.post('/orders/create', formData)
            navigate('/my-orders', { 
                state: { 
                    newOrder: res.data.data,
                    token: res.data.data.pickupToken 
                } 
            })
        } catch(err) {
            setError(err.response?.data?.message || 'Order failed')
        } finally {
            setLoading(false)
        }
    }

    if(fetchLoading) return (
        <div className="min-h-screen flex items-center justify-center"
            style={{ backgroundColor: '#0F1117' }}>
            <div className="w-8 h-8 rounded-full border-2 animate-spin"
                style={{ borderColor: '#10B981',
                         borderTopColor: 'transparent' }} />
        </div>
    )

    const priceEntry = getPriceEntry()
    const total = calculateTotal()

    

    return (
        <div className="min-h-screen pb-32"
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
                            Place Order
                        </h1>
                        {vendor && (
                            <p className="text-xs"
                                style={{ color: '#64748B' }}>
                                {vendor.shopName}
                            </p>
                        )}
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

                {/* File Upload */}
                <div className="p-4 rounded-2xl"
                    style={{ backgroundColor: '#1A1D27',
                             border: '1px solid #2E3148' }}>

                    <p className="text-sm font-semibold mb-3"
                        style={{ color: '#F1F5F9' }}>
                        Upload File
                    </p>

                    <label className="flex flex-col items-center justify-center
                                      w-full h-32 rounded-xl cursor-pointer
                                      transition-colors"
                        style={{ 
                            backgroundColor: '#222536',
                            border: file 
                                ? '1.5px solid #10B981' 
                                : '1.5px dashed #2E3148' 
                        }}>
                        <input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={handleFileChange}
                            className="hidden"
                        />
                        {file ? (
                            <div className="flex flex-col items-center gap-2">
                                <FileText size={28} color="#10B981" />
                                <p className="text-sm font-medium"
                                    style={{ color: '#10B981' }}>
                                    {file.name}
                                </p>
                                <p className="text-xs"
                                    style={{ color: '#64748B' }}>
                                    {(file.size / 1024).toFixed(1)} KB
                                </p>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-2">
                                <Upload size={28} color="#64748B" />
                                <p className="text-sm"
                                    style={{ color: '#64748B' }}>
                                    Tap to upload PDF or Image
                                </p>
                                <p className="text-xs"
                                    style={{ color: '#2E3148' }}>
                                    PDF, JPG, PNG supported
                                </p>
                            </div>
                        )}
                    </label>
                </div>

                {/* Print Config */}
                <div className="p-4 rounded-2xl space-y-4"
                    style={{ backgroundColor: '#1A1D27',
                             border: '1px solid #2E3148' }}>

                    <p className="text-sm font-semibold"
                        style={{ color: '#F1F5F9' }}>
                        Print Settings
                    </p>

                    {/* Paper Size */}
                    <div>
                        <label className="block text-xs mb-2"
                            style={{ color: '#94A3B8' }}>
                            Paper Size
                        </label>
                        <div className="flex gap-2">
                            {PAPER_SIZES.map(size => (
                                <button
                                    key={size}
                                    onClick={() => setPaperSize(size)}
                                    className="flex-1 py-2 rounded-xl text-sm font-medium
                                               transition-colors"
                                    style={{
                                        backgroundColor: paperSize === size
                                            ? '#10B981' : '#222536',
                                        color: paperSize === size
                                            ? '#ffffff' : '#94A3B8',
                                        border: '1px solid',
                                        borderColor: paperSize === size
                                            ? '#10B981' : '#2E3148'
                                    }}>
                                    {size}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Print Type */}
                    <div>
                        <label className="block text-xs mb-2"
                            style={{ color: '#94A3B8' }}>
                            Print Type
                        </label>
                        <div className="relative">
                            <select
                                value={printType}
                                onChange={(e) => setPrintType(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl text-sm 
                                           outline-none appearance-none"
                                style={{
                                    backgroundColor: '#222536',
                                    border: '1px solid #2E3148',
                                    color: '#F1F5F9'
                                }}>
                                {PRINT_TYPES.map(t => (
                                    <option key={t.value} value={t.value}>
                                        {t.label}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown
                                size={16}
                                color="#64748B"
                                className="absolute right-3 top-3.5 pointer-events-none"
                            />
                        </div>
                    </div>

                    {/* Page Count + Copies */}
                    <div className="flex gap-3">

                        {/* Page Count */}
                        <div className="flex-1">
                            <label className="block text-xs mb-2"
                                style={{ color: '#94A3B8' }}>
                                Number of Pages
                            </label>
                            <input
                                type="number"
                                min={1}
                                value={pageCount}
                                onChange={(e) => setPageCount(
                                    Math.max(1, parseInt(e.target.value) || 1)
                                )}
                                className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                                style={{
                                    backgroundColor: '#222536',
                                    border: '1px solid #2E3148',
                                    color: '#F1F5F9'
                                }}
                            />
                        </div>

                        {/* Copies */}
                        <div className="flex-1">
                            <label className="block text-xs mb-2"
                                style={{ color: '#94A3B8' }}>
                                Copies
                            </label>
                            <input
                                type="number"
                                min={1}
                                value={copies}
                                onChange={(e) => setCopies(
                                    Math.max(1, parseInt(e.target.value) || 1)
                                )}
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

                {/* Payment Method */}
                <div className="p-4 rounded-2xl"
                    style={{ backgroundColor: '#1A1D27',
                             border: '1px solid #2E3148' }}>

                    <p className="text-sm font-semibold mb-3"
                        style={{ color: '#F1F5F9' }}>
                        Payment Method
                    </p>

                    <div className="flex gap-3">
                        {['cash', 'upi'].map(method => (
                            <button
                                key={method}
                                onClick={() => setPaymentMethod(method)}
                                className="flex-1 py-3 rounded-xl text-sm 
                                           font-medium capitalize transition-colors"
                                style={{
                                    backgroundColor: paymentMethod === method
                                        ? '#10B981' : '#222536',
                                    color: paymentMethod === method
                                        ? '#ffffff' : '#94A3B8',
                                    border: '1px solid',
                                    borderColor: paymentMethod === method
                                        ? '#10B981' : '#2E3148'
                                }}>
                                {method === 'cash' ? 'Cash on Pickup' : 'UPI'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Order Summary */}
                {priceEntry && (
                    <div className="p-4 rounded-2xl"
                        style={{ backgroundColor: '#1A1D27',
                                 border: '1px solid #2E3148' }}>

                        <p className="text-sm font-semibold mb-3"
                            style={{ color: '#F1F5F9' }}>
                            Order Summary
                        </p>

                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span style={{ color: '#64748B' }}>
                                    Price per page
                                </span>
                                <span style={{ color: '#F1F5F9' }}>
                                    ₹{priceEntry.pricePerPage}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span style={{ color: '#64748B' }}>
                                    Pages × Copies
                                </span>
                                <span style={{ color: '#F1F5F9' }}>
                                    {pageCount} × {copies}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span style={{ color: '#64748B' }}>
                                    Platform Fee
                                </span>
                                <span style={{ color: '#10B981' }}>
                                    Free
                                </span>
                            </div>

                            {/* Divider */}
                            <div style={{ borderTop: '1px solid #2E3148' }} 
                                className="pt-2 mt-2">
                                <div className="flex justify-between">
                                    <span className="text-sm font-semibold"
                                        style={{ color: '#F1F5F9' }}>
                                        Total
                                    </span>
                                    <span className="text-base font-bold"
                                        style={{ color: '#10B981' }}>
                                        ₹{total}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* No pricing available warning */}
                {!priceEntry && vendor && (
                    <div className="px-4 py-3 rounded-xl text-sm"
                        style={{ backgroundColor: '#2D2000',
                                 color: '#EAB308',
                                 border: '1px solid #EAB308' }}>
                        This shop does not offer {paperSize} {' '}
                        {PRINT_TYPES.find(t => t.value === printType)?.label}
                    </div>
                )}

            </div>

            {/* Bottom CTA */}
            <div className="fixed bottom-0 left-0 right-0 px-4 py-4"
                style={{ backgroundColor: '#1A1D27',
                         borderTop: '1px solid #2E3148' }}>
                <div className="max-w-lg mx-auto">
                    <button
                        onClick={handleSubmit}
                        disabled={loading || !file || !priceEntry}
                        className="w-full py-3.5 rounded-xl font-semibold 
                                   text-sm flex items-center justify-center gap-2"
                        style={{
                            backgroundColor: (!file || !priceEntry)
                                ? '#222536' : '#10B981',
                            color: (!file || !priceEntry)
                                ? '#64748B' : '#ffffff',
                            opacity: loading ? 0.6 : 1,
                            cursor: (!file || !priceEntry)
                                ? 'not-allowed' : 'pointer'
                        }}>
                        <Printer size={16} />
                        {loading ? 'Placing Order...' : `Place Order${total ? ` — ₹${total}` : ''}`}
                    </button>
                </div>
            </div>

        </div>
    )
}

export default CreateOrder
