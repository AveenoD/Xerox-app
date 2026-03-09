import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import api from '../../utils/axios.js'

const VerifyOtp = () => {
    const [otp, setOtp] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [resendLoading, setResendLoading] = useState(false)
    const [resendSuccess, setResendSuccess] = useState('')

    const navigate = useNavigate()
    const location = useLocation()
    const email = location.state?.email

    // Agar email nahi hai toh register pe bhejo
    if(!email) {
        navigate('/register')
        return null
    }

    const handleVerify = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            await api.post('/auth/verify-email-otp', { email, otp })
            navigate('/login', { 
                state: { message: 'Email verified! Ab login karo.' } 
            })
        } catch(err) {
            setError(err.response?.data?.message || 'Invalid OTP')
        } finally {
            setLoading(false)
        }
    }

    const handleResend = async () => {
        setResendLoading(true)
        setError('')
        setResendSuccess('')

        try {
            await api.post('/auth/resend-email-otp', { email })
            setResendSuccess('Naya OTP bheja gaya!')
        } catch(err) {
            setError(err.response?.data?.message || 'Resend failed')
        } finally {
            setResendLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center"
            style={{ backgroundColor: '#0F1117' }}>

            <div className="w-full max-w-md p-8 rounded-2xl"
                style={{ backgroundColor: '#1A1D27',
                         border: '1px solid #2E3148' }}>

                {/* Logo */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold"
                        style={{ color: '#10B981' }}>
                        XConnect
                    </h1>
                    <p className="text-sm mt-1"
                        style={{ color: '#64748B' }}>
                        Print Shop Marketplace
                    </p>
                </div>

                {/* Icon */}
                <div className="text-center mb-6">
                    <div className="text-5xl mb-3">📧</div>
                    <h2 className="text-xl font-semibold"
                        style={{ color: '#F1F5F9' }}>
                        Email Verify Karo
                    </h2>
                    <p className="text-sm mt-2"
                        style={{ color: '#64748B' }}>
                        OTP bheja gaya hai{' '}
                        <span style={{ color: '#10B981' }}>
                            {email}
                        </span>{' '}
                        pe
                    </p>
                </div>

                {/* Error */}
                {error && (
                    <div className="mb-4 px-4 py-3 rounded-lg text-sm"
                        style={{ backgroundColor: '#2D1515',
                                 color: '#EF4444',
                                 border: '1px solid #EF4444' }}>
                        {error}
                    </div>
                )}

                {/* Resend Success */}
                {resendSuccess && (
                    <div className="mb-4 px-4 py-3 rounded-lg text-sm"
                        style={{ backgroundColor: '#0D2B1F',
                                 color: '#10B981',
                                 border: '1px solid #10B981' }}>
                        {resendSuccess}
                    </div>
                )}

                <form onSubmit={handleVerify} className="space-y-4">

                    {/* OTP Input */}
                    <div>
                        <label className="block text-sm mb-1.5"
                            style={{ color: '#94A3B8' }}>
                            6-Digit OTP
                        </label>
                        <input
                            type="text"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            placeholder="••••••"
                            maxLength={6}
                            required
                            className="w-full px-4 py-3 rounded-xl text-sm 
                                       outline-none text-center tracking-widest 
                                       text-2xl font-bold"
                            style={{
                                backgroundColor: '#222536',
                                border: '1px solid #2E3148',
                                color: '#F1F5F9',
                                letterSpacing: '0.5rem'
                            }}
                        />
                    </div>

                    {/* Verify Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 rounded-xl font-semibold text-sm"
                        style={{
                            backgroundColor: '#10B981',
                            color: '#ffffff',
                            opacity: loading ? 0.6 : 1
                        }}>
                        {loading ? 'Verifying...' : 'Verify Email'}
                    </button>

                </form>

                {/* Resend */}
                <div className="mt-4 text-center">
                    <p className="text-sm" style={{ color: '#64748B' }}>
                        OTP nahi aaya?{' '}
                        <button
                            onClick={handleResend}
                            disabled={resendLoading}
                            style={{ color: '#10B981' }}
                            className="font-medium">
                            {resendLoading ? 'Bhej raha hoon...' : 'Resend karo'}
                        </button>
                    </p>
                </div>

                {/* Back to Register */}
                <div className="mt-3 text-center">
                    <button
                        onClick={() => navigate('/register')}
                        className="text-sm"
                        style={{ color: '#64748B' }}>
                        ← Wapas Register pe jaao
                    </button>
                </div>

            </div>
        </div>
    )
}

export default VerifyOtp
