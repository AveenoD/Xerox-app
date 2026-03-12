import { createContext, useContext, useState, useEffect } from 'react'
import api from '../utils/axios.js'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    // App mount pe silently refresh karo
    useEffect(() => {
        const restoreSession = async () => {
            try {
                const res = await api.post('/auth/refresh-token')
                window.__accessToken = res.data.data.accessToken
                setUser(res.data.data.user)
            } catch (err) {
                // 401 ya 500 dono pe — sirf null set karo
                window.__accessToken = null
                setUser(null)
            } finally {
                setLoading(false)
            }
        }
        restoreSession()
    }, [])

    const login = (userData, accessToken) => {
        window.__accessToken = accessToken
        setUser(userData)
    }

    const logout = async () => {
        try {
            await api.post('/auth/logout')
        } catch (err) {
            console.error(err)
        } finally {
            window.__accessToken = null
            setUser(null)
        }
    }

    return (
        <AuthContext.Provider value={{ user, setUser, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)