import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import api from '../../utils/axios.js'

const Login = () => {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const { login } = useAuth()
    const navigate = useNavigate()

    const handleLogin = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            const res = await api.post('/auth/login', { email, password })
            login(res.data.data.user, res.data.data.accessToken)

            if(res.data.data.user.role === 'vendor'){
                navigate('/dashboard')
            } else {
                navigate('/')
            }
        } catch(err) {
            setError(err.response?.data?.message || 'Login failed')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center"
            style={{ backgroundColor: '#0F1117' }}>

            {/* Card */}
            <div className="w-full max-w-md p-8 rounded-2xl"
                style={{ backgroundColor: '#1A1D27', border: '1px solid #2E3148' }}>

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

                {/* Title */}
                <h2 className="text-xl font-semibold mb-6"
                    style={{ color: '#F1F5F9' }}>
                    Welcome back
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

                {/* Form */}
                <form onSubmit={handleLogin} className="space-y-4">

                    {/* Email */}
                    <div>
                        <label className="block text-sm mb-1.5"
                            style={{ color: '#94A3B8' }}>
                            Email
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            required
                            className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                            style={{
                                backgroundColor: '#222536',
                                border: '1px solid #2E3148',
                                color: '#F1F5F9',
                            }}
                        />
                    </div>

                    {/* Password */}
                    <div>
                        <label className="block text-sm mb-1.5"
                            style={{ color: '#94A3B8' }}>
                            Password
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                            style={{
                                backgroundColor: '#222536',
                                border: '1px solid #2E3148',
                                color: '#F1F5F9',
                            }}
                        />
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 rounded-xl font-semibold text-sm mt-2 transition-opacity"
                        style={{ backgroundColor: '#10B981', color: '#ffffff' }}>
                        {loading ? 'Logging in...' : 'Login'}
                    </button>

                </form>

                {/* Footer Links */}
                <div className="mt-6 text-center space-y-2">
                    <p className="text-sm" style={{ color: '#64748B' }}>
                        Account nahi hai?{' '}
                        <Link to="/register"    
                            style={{ color: '#10B981' }}
                            className="font-medium">
                            Register karo
                        </Link>
                    </p>
                </div>

            </div>
        </div>
    )
}

export default Login