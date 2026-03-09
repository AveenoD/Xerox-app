import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../../utils/axios.js'

const Register = () => {
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: '',
        password: ''
    })
    const [avatar, setAvatar] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const navigate = useNavigate()

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            const data = new FormData()
            data.append('fullName', formData.fullName)
            data.append('email', formData.email)
            data.append('phone', formData.phone)
            data.append('password', formData.password)
            if(avatar) data.append('avatar', avatar)

            await api.post('/auth/register', data)

            // OTP verify page pe jaao — email pass karo
            navigate('/verify-otp', { state: { email: formData.email } })

        } catch(err) {
            setError(err.response?.data?.message || 'Registration failed')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center py-10"
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

                <h2 className="text-xl font-semibold mb-6"
                    style={{ color: '#F1F5F9' }}>
                    Create account
                </h2>

                {/* Error */}
                {error && (
                    <div className="mb-4 px-4 py-3 rounded-lg text-sm"
                        style={{ backgroundColor: '#2D1515',
                                 color: '#EF4444',
                                 border: '1px solid #EF4444' }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">

                    {/* Full Name */}
                    <div>
                        <label className="block text-sm mb-1.5"
                            style={{ color: '#94A3B8' }}>
                            Full Name
                        </label>
                        <input
                            type="text"
                            name="fullName"
                            value={formData.fullName}
                            onChange={handleChange}
                            placeholder="Anees Shaikh"
                            required
                            className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                            style={{
                                backgroundColor: '#222536',
                                border: '1px solid #2E3148',
                                color: '#F1F5F9'
                            }}
                        />
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block text-sm mb-1.5"
                            style={{ color: '#94A3B8' }}>
                            Email
                        </label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="you@example.com"
                            required
                            className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                            style={{
                                backgroundColor: '#222536',
                                border: '1px solid #2E3148',
                                color: '#F1F5F9'
                            }}
                        />
                    </div>

                    {/* Phone */}
                    <div>
                        <label className="block text-sm mb-1.5"
                            style={{ color: '#94A3B8' }}>
                            Phone Number
                        </label>
                        <div className="flex gap-2">
                            <div className="px-3 py-3 rounded-xl text-sm flex items-center"
                                style={{
                                    backgroundColor: '#222536',
                                    border: '1px solid #2E3148',
                                    color: '#94A3B8'
                                }}>
                                +91
                            </div>
                            <input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                placeholder="9876543210"
                                required
                                maxLength={10}
                                className="flex-1 px-4 py-3 rounded-xl text-sm outline-none"
                                style={{
                                    backgroundColor: '#222536',
                                    border: '1px solid #2E3148',
                                    color: '#F1F5F9'
                                }}
                            />
                        </div>
                    </div>

                    {/* Password */}
                    <div>
                        <label className="block text-sm mb-1.5"
                            style={{ color: '#94A3B8' }}>
                            Password
                        </label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="••••••••"
                            required
                            className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                            style={{
                                backgroundColor: '#222536',
                                border: '1px solid #2E3148',
                                color: '#F1F5F9'
                            }}
                        />
                    </div>

                    {/* Avatar — Optional */}
                    <div>
                        <label className="block text-sm mb-1.5"
                            style={{ color: '#94A3B8' }}>
                            Profile Photo{' '}
                            <span style={{ color: '#64748B' }}>
                                (optional)
                            </span>
                        </label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setAvatar(e.target.files[0])}
                            className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                            style={{
                                backgroundColor: '#222536',
                                border: '1px solid #2E3148',
                                color: '#94A3B8'
                            }}
                        />
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 rounded-xl font-semibold text-sm mt-2"
                        style={{
                            backgroundColor: '#10B981',
                            color: '#ffffff',
                            opacity: loading ? 0.6 : 1
                        }}>
                        {loading ? 'Creating account...' : 'Create Account'}
                    </button>

                </form>

                <div className="mt-6 text-center">
                    <p className="text-sm" style={{ color: '#64748B' }}>
                        Already account hai?{' '}
                        <Link to="/login"
                            style={{ color: '#10B981' }}
                            className="font-medium">
                            Login karo
                        </Link>
                    </p>
                </div>

            </div>
        </div>
    )
}

export default Register