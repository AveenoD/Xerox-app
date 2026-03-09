import { Outlet } from 'react-router-dom'
import Navbar from './Navbar.jsx'

const Layout = () => {
    return (
        <>
            <Outlet />
            <Navbar />
        </>
    )
}

export default Layout