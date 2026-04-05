import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import Home from './pages/customer/Home.jsx'
import Login from './pages/auth/Login.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import ProtectedRoute from './components/auth/ProtectedRoute.jsx'
import Register from './pages/auth/Register.jsx'
import VerifyOtp from './pages/auth/VerifyOtp.jsx'
import MyOrders from './pages/customer/MyOrders.jsx'
import Layout from './components/common/Layout.jsx'
import BecomeVendor from './pages/vendor/BecomeVendor.jsx'
import ManageShop from './pages/vendor/ManageShop.jsx'
import Profile from './pages/shared/Profile.jsx'
import AdminDashboard from './pages/admin/AdminDashboard.jsx'
import AdminNotify from './pages/admin/AdminNotify.jsx'

// Lazy load heavy components
const Dashboard = lazy(() => import('./pages/vendor/Dashboard.jsx'))
const CreateOrder = lazy(() => import('./pages/customer/CreateOrder.jsx'))
const Wallet = lazy(() => import('./pages/customer/Wallet.jsx'))
const Referral = lazy(() => import('./pages/customer/Referral.jsx'))
const OrderDetail = lazy(() => import('./pages/shared/OrderDetail.jsx'))
const VendorDetail = lazy(() => import('./pages/customer/VendorDetail.jsx'))
const Dispute = lazy(() => import('./pages/customer/Dispute.jsx'))

// Loading fallback component
const PageLoader = () => (
    <div className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: '#0F1117' }}>
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: '#10B981', borderTopColor: 'transparent' }}>
        </div>
    </div>
)


const router = createBrowserRouter([
    { path: '/register', element: <Register /> },
    { path: '/verify-otp', element: <VerifyOtp /> },
    { path: '/login', element: <Login />},
    
    {
        element: <Layout />,
        children: [
            {
                element: <ProtectedRoute />,
                children: [
                    { path: '/', element: <Home /> },
                    { path: '/vendor/:vendorId', element: <Suspense fallback={<PageLoader />}><VendorDetail /></Suspense> },
                    { path: '/create-order/:vendorId', element: <Suspense fallback={<PageLoader />}><CreateOrder /></Suspense> },
                    { path: '/my-orders', element: <MyOrders /> },
                    { path: '/order/:orderId', element: <Suspense fallback={<PageLoader />}><OrderDetail /></Suspense> },
                    { path: '/become-vendor', element: <BecomeVendor /> },
                    { path: '/profile', element: <Profile /> },
                    { path: '/wallet', element: <Suspense fallback={<PageLoader />}><Wallet /></Suspense> },
                    { path: '/referral', element: <Suspense fallback={<PageLoader />}><Referral /></Suspense> },
                    { path: '/disputes', element: <Suspense fallback={<PageLoader />}><Dispute /></Suspense> },
                ]
            },
            {
                element: <ProtectedRoute requiredRole="vendor" />,
                children: [
                    { path: '/dashboard', element: <Suspense fallback={<PageLoader />}><Dashboard /></Suspense> },
                    { path: '/manage-shop', element: <ManageShop /> },
                ]
            },
            {
                element: <ProtectedRoute requiredRole="admin" />,
                children: [
                    { path: '/admin', element: <AdminDashboard /> },
                    { path: '/admin/notify', element: <AdminNotify /> },
                ]
            }
        ]
    }
])
createRoot(document.getElementById('root')).render(
     <StrictMode>
        <AuthProvider>
            <RouterProvider router={router} />
        </AuthProvider>
    </StrictMode>
)
