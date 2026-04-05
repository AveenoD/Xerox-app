import { useNavigate, useLocation } from 'react-router-dom'
import { Home, Package, User, LayoutDashboard, Settings, Wallet } from 'lucide-react'
import { useAuth } from '../../context/AuthContext.jsx'

const CUSTOMER_TABS = [
    { path: '/',          icon: Home,            label: 'Home' },
    { path: '/my-orders', icon: Package,         label: 'Orders' },
    { path: '/wallet',    icon: Wallet,          label: 'Wallet' },
    { path: '/profile',   icon: User,            label: 'Profile' },
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

    const hideOn = ['/login', '/register', '/verify-otp', '/admin']
    const hideOnDynamic = ['/create-order', '/vendor', '/referral', '/disputes', '/order/']

    const shouldHide =
        hideOn.includes(location.pathname) ||
        hideOn.some(path => location.pathname.startsWith(path)) ||
        hideOnDynamic.some(path => location.pathname.startsWith(path))

    if(shouldHide) return null

    const tabs = user?.role === 'vendor' ? VENDOR_TABS : CUSTOMER_TABS

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 glass-nav safe-area-bottom">
            <div className="max-w-lg mx-auto flex justify-around px-4 py-2">
                {tabs.map(tab => {
                    const Icon = tab.icon
                    const isActive = location.pathname === tab.path

                    return (
                        <button
                            key={tab.path}
                            onClick={() => navigate(tab.path)}
                            className="flex flex-col items-center gap-1 py-2 px-4 rounded-xl transition-all duration-200 active:scale-95 min-w-[64px]"
                            style={{
                                backgroundColor: isActive ? 'rgba(16, 185, 129, 0.15)' : 'transparent'
                            }}
                        >
                            <div className="relative">
                                <Icon
                                    size={22}
                                    color={isActive ? '#10B981' : '#64748B'}
                                    strokeWidth={isActive ? 2.5 : 1.5}
                                />
                                {isActive && (
                                    <div 
                                        className="absolute -inset-1 rounded-full opacity-50"
                                        style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)' }}
                                    />
                                )}
                            </div>
                            <span 
                                className="text-xs font-medium mt-1"
                                style={{ color: isActive ? '#10B981' : '#64748B' }}
                            >
                                {tab.label}
                            </span>
                        </button>
                    )
                })}
            </div>
        </nav>
    )
}

export default Navbar