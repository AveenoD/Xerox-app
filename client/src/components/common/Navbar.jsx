import { useNavigate, useLocation } from 'react-router-dom'
import { Home, Package, User, LayoutDashboard, Settings } from 'lucide-react'
import { useAuth } from '../../context/AuthContext.jsx'

const CUSTOMER_TABS = [
    { path: '/',          icon: Home,            label: 'Home' },
    { path: '/my-orders', icon: Package,          label: 'Orders' },
    { path: '/profile',   icon: User,             label: 'Profile' },
]

const VENDOR_TABS = [
    { path: '/dashboard',   icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/manage-shop', icon: Settings,         label: 'Shop' },
    { path: '/profile',     icon: User,             label: 'Profile' },
]

const Navbar = () => {
    const { user } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()

    const hideOn = ['/login', '/register', '/verify-otp']
    const hideOnDynamic = ['/create-order', '/vendor']

    const shouldHide =
        hideOn.includes(location.pathname) ||
        hideOnDynamic.some(path => location.pathname.startsWith(path))

    if(shouldHide) return null

    const tabs = user?.role === 'vendor' ? VENDOR_TABS : CUSTOMER_TABS

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 px-4 py-3"
            style={{ backgroundColor: '#1A1D27',
                     borderTop: '1px solid #2E3148' }}>
            <div className="max-w-lg mx-auto flex justify-around">
                {tabs.map(tab => {
                    const Icon = tab.icon
                    const isActive = location.pathname === tab.path

                    return (
                        <button
                            key={tab.path}
                            onClick={() => navigate(tab.path)}
                            className="flex flex-col items-center gap-1">
                            <Icon
                                size={20}
                                color={isActive ? '#10B981' : '#64748B'}
                                strokeWidth={isActive ? 2.5 : 1.5}
                            />
                            <span className="text-xs"
                                style={{ color: isActive ? '#10B981' : '#64748B' }}>
                                {tab.label}
                            </span>
                        </button>
                    )
                })}
            </div>
        </div>
    )
}

export default Navbar