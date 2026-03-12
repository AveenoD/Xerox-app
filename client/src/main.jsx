import { StrictMode } from 'react'
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
import VendorDetail from './pages/customer/VendorDetail.jsx'
import CreateOrder from './pages/customer/CreateOrder.jsx'
import MyOrders from './pages/customer/MyOrders.jsx'
import OrderDetail from './pages/shared/OrderDetail.jsx'
import Dashboard from './pages/vendor/Dashboard.jsx'
import Layout from './components/common/Layout.jsx'
import BecomeVendor from './pages/vendor/BecomeVendor.jsx'
import ManageShop from './pages/vendor/ManageShop.jsx'
import Profile from './pages/shared/Profile.jsx'


const router = createBrowserRouter([
    { path: '/register', element: <Register /> },
    { path: '/verify-otp', element: <VerifyOtp /> },
    { path: '/login', element: <Login />},
    
      {
        element: <Layout />,
        children:[
            {
        element: <ProtectedRoute />,
        children: [
            { path: '/', element: <Home /> },
            { path: '/vendor/:vendorId', element: <VendorDetail /> },
            { path: '/create-order/:vendorId', element: <CreateOrder /> },
            { path: '/my-orders', element: <MyOrders /> },
            { path: '/order/:orderId', element: <OrderDetail /> },
           { path: '/become-vendor', element: <BecomeVendor /> },
           { path: '/profile', element: <Profile /> },
        ]
    },

    {
        element: <ProtectedRoute requiredRole="vendor" />,
        children: [
            { path: '/dashboard', element: <Dashboard /> },
            { path: '/manage-shop', element: <ManageShop /> },
           
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
