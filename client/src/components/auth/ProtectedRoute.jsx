import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'

const ProtectedRoute = ({ requiredRole }) => {
    const { user, loading } = useAuth()

    if(loading) return <div>Loading...</div>

    if(!user) return <Navigate to="/login" replace />

    if(requiredRole && user.role !== requiredRole){
        return <Navigate to="/" replace />
    }

    return <Outlet />
}

export default ProtectedRoute