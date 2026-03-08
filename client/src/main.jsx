import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import Home from './pages/customer/Home.jsx'
import Login from './pages/auth/Login.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import ProtectedRoute from './components/auth/ProtectedRoute.jsx'

const router = createBrowserRouter([
    {
         path: '/login', element: <Login />
    },
    { path: '/', element: <Home /> }
])
createRoot(document.getElementById('root')).render(
     <StrictMode>
        <AuthProvider>
            <RouterProvider router={router} />
        </AuthProvider>
    </StrictMode>
)
