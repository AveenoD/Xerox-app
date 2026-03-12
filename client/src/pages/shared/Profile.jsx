import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
    ArrowLeft, User, Mail, Phone, 
    Lock, Camera, LogOut, Store,
    ChevronRight, Save
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext.jsx'
import api from '../../utils/axios.js'

const Profile = () => {
    const { user, setUser, logout } = useAuth()
    const navigate = useNavigate()

    const [activeTab, setActiveTab] = useState('profile')
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    const [profileData, setProfileData] = useState({
        fullName: user?.fullName || '',
        phone: user?.phone || '',
    })

    const [passwordData, setPasswordData] = useState({
        oldPassword: '',
        newPassword: '',
        confirmPassword: '',
    })

    const [avatar, setAvatar] = useState(null)
    const [avatarPreview, setAvatarPreview] = useState(user?.avatar || null)

    const handleProfileChange = (e) => {
        setProfileData({ ...profileData, [e.target.name]: e.target.value })
    }

    const handlePasswordChange = (e) => {
        setPasswordData({ ...passwordData, [e.target.name]: e.target.value })
    }

    const handleAvatarChange = async (e) => {
        const file = e.target.files[0]
        if(!file) return

        setAvatar(file)
        setAvatarPreview(URL.createObjectURL(file))

        // Immediately upload
        const formData = new FormData()
        formData.append('avatar', file)
        try {
            const res = await api.put('/user/profile/avatar-update', formData)
            setUser(prev => ({ ...prev, avatar: res.data.data.avatar }))
            showSuccess('Avatar updated!')
        } catch(err) {
            showError('Avatar update failed')
        }
    }

    const handleUpdateProfile = async () => {
        setSaving(true)
        setError('')
        setSuccess('')
        try {
            const res = await api.put('/user/profile-update', profileData)
            setUser(prev => ({ ...prev, ...profileData }))
            showSuccess('Profile updated successfully!')
        } catch(err) {
            showError(err.response?.data?.message || 'Update failed')
        } finally {
            setSaving(false)
        }
    }

    const handleUpdatePassword = async () => {
        if(passwordData.newPassword !== passwordData.confirmPassword){
            return showError('New passwords do not match')
        }
        if(passwordData.newPassword.length < 8){
            return showError('Password must be at least 8 characters')
        }

        setSaving(true)
        setError('')
        setSuccess('')
        try {
            await api.put('/user/profile/password-update', {
                oldPassword: passwordData.oldPassword,
                newPassword: passwordData.newPassword,
            })
            setPasswordData({
                oldPassword: '', newPassword: '', confirmPassword: ''
            })
            showSuccess('Password updated successfully!')
        } catch(err) {
            showError(err.response?.data?.message || 'Password update failed')
        } finally {
            setSaving(false)
        }
    }

    const showSuccess = (msg) => {
        setSuccess(msg)
        setTimeout(() => setSuccess(''), 3000)
    }

    const showError = (msg) => {
        setError(msg)
        setTimeout(() => setError(''), 4000)
    }

    const handleLogout = async () => {
        await logout()
        navigate('/login')
    }

    return (
        <div className="min-h-screen pb-24"
            style={{ backgroundColor: '#0F1117' }}>

            {/* Header */}
            <div className="sticky top-0 z-10 px-4 py-4"
                style={{ backgroundColor: '#0F1117',
                         borderBottom: '1px solid #2E3148' }}>
                <div className="max-w-lg mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button onClick={() => navigate(-1)}
                            className="w-9 h-9 rounded-xl flex items-center justify-center"
                            style={{ backgroundColor: '#1A1D27',
                                     border: '1px solid #2E3148' }}>
                            <ArrowLeft size={16} color="#F1F5F9" />
                        </button>
                        <h1 className="text-base font-semibold"
                            style={{ color: '#F1F5F9' }}>
                            My Profile
                        </h1>
                    </div>

                    {/* Logout */}
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl
                                   text-sm font-medium"
                        style={{ backgroundColor: '#2D1515',
                                 color: '#EF4444',
                                 border: '1px solid #EF4444' }}>
                        <LogOut size={14} />
                        Logout
                    </button>
                </div>
            </div>

            <div className="max-w-lg mx-auto px-4 py-4 space-y-4">

                {/* Error */}
                {error && (
                    <div className="px-4 py-3 rounded-xl text-sm"
                        style={{ backgroundColor: '#2D1515',
                                 color: '#EF4444',
                                 border: '1px solid #EF4444' }}>
                        {error}
                    </div>
                )}

                {/* Success */}
                {success && (
                    <div className="px-4 py-3 rounded-xl text-sm"
                        style={{ backgroundColor: '#0D2B1F',
                                 color: '#10B981',
                                 border: '1px solid #10B981' }}>
                        {success}
                    </div>
                )}

                {/* Avatar + Name Card */}
                <div className="p-4 rounded-2xl flex items-center gap-4"
                    style={{ backgroundColor: '#1A1D27',
                             border: '1px solid #2E3148' }}>

                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                        <div className="w-16 h-16 rounded-2xl overflow-hidden
                                        flex items-center justify-center"
                            style={{ backgroundColor: '#222536' }}>
                            {avatarPreview ? (
                                <img src={avatarPreview}
                                    alt="avatar"
                                    className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-2xl font-bold"
                                    style={{ color: '#10B981' }}>
                                    {user?.fullName?.[0]?.toUpperCase()}
                                </span>
                            )}
                        </div>

                        {/* Camera Button */}
                        <label className="absolute -bottom-1 -right-1 w-6 h-6 
                                          rounded-lg flex items-center justify-center
                                          cursor-pointer"
                            style={{ backgroundColor: '#10B981' }}>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleAvatarChange}
                                className="hidden"
                            />
                            <Camera size={12} color="#ffffff" />
                        </label>
                    </div>

                    {/* Name + Role */}
                    <div>
                        <p className="text-base font-semibold"
                            style={{ color: '#F1F5F9' }}>
                            {user?.fullName}
                        </p>
                        <p className="text-xs mt-0.5"
                            style={{ color: '#64748B' }}>
                            {user?.email}
                        </p>
                        <span className="inline-block mt-1.5 text-xs px-2.5 py-0.5 
                                         rounded-full capitalize font-medium"
                            style={{
                                backgroundColor: user?.role === 'vendor'
                                    ? '#0D2B1F' : '#0D1B2B',
                                color: user?.role === 'vendor'
                                    ? '#10B981' : '#3B82F6'
                            }}>
                            {user?.role}
                        </span>
                    </div>
                </div>

                {/* Become Vendor CTA — only for customers */}
                {user?.role === 'customer' && (
                    <button
                        onClick={() => navigate('/become-vendor')}
                        className="w-full p-4 rounded-2xl flex items-center 
                                   justify-between"
                        style={{ backgroundColor: '#1A1D27',
                                 border: '1px solid #2E3148' }}>
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl flex items-center 
                                            justify-center"
                                style={{ backgroundColor: '#0D2B1F' }}>
                                <Store size={16} color="#10B981" />
                            </div>
                            <div className="text-left">
                                <p className="text-sm font-semibold"
                                    style={{ color: '#F1F5F9' }}>
                                    Become a Vendor
                                </p>
                                <p className="text-xs"
                                    style={{ color: '#64748B' }}>
                                    Register your print shop on XConnect
                                </p>
                            </div>
                        </div>
                        <ChevronRight size={16} color="#64748B" />
                    </button>
                )}

                {/* Tabs */}
                <div className="flex gap-2">
                    {['profile', 'password'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className="flex-1 py-2.5 rounded-xl text-sm 
                                       font-medium capitalize"
                            style={{
                                backgroundColor: activeTab === tab
                                    ? '#10B981' : '#1A1D27',
                                color: activeTab === tab
                                    ? '#ffffff' : '#64748B',
                                border: '1px solid',
                                borderColor: activeTab === tab
                                    ? '#10B981' : '#2E3148'
                            }}>
                            {tab === 'profile' ? 'Edit Profile' : 'Change Password'}
                        </button>
                    ))}
                </div>

                {/* Profile Tab */}
                {activeTab === 'profile' && (
                    <div className="p-4 rounded-2xl space-y-4"
                        style={{ backgroundColor: '#1A1D27',
                                 border: '1px solid #2E3148' }}>

                        {/* Full Name */}
                        <div>
                            <label className="block text-xs mb-1.5"
                                style={{ color: '#94A3B8' }}>
                                Full Name
                            </label>
                            <div className="relative">
                                <User size={15} color="#64748B"
                                    className="absolute left-3 top-3.5" />
                                <input
                                    type="text"
                                    name="fullName"
                                    value={profileData.fullName}
                                    onChange={handleProfileChange}
                                    className="w-full pl-9 pr-4 py-3 rounded-xl 
                                               text-sm outline-none"
                                    style={{
                                        backgroundColor: '#222536',
                                        border: '1px solid #2E3148',
                                        color: '#F1F5F9'
                                    }}
                                />
                            </div>
                        </div>

                        {/* Phone */}
                        <div>
                            <label className="block text-xs mb-1.5"
                                style={{ color: '#94A3B8' }}>
                                Phone Number
                            </label>
                            <div className="relative">
                                <Phone size={15} color="#64748B"
                                    className="absolute left-3 top-3.5" />
                                <input
                                    type="tel"
                                    name="phone"
                                    value={profileData.phone}
                                    onChange={handleProfileChange}
                                    maxLength={10}
                                    className="w-full pl-9 pr-4 py-3 rounded-xl 
                                               text-sm outline-none"
                                    style={{
                                        backgroundColor: '#222536',
                                        border: '1px solid #2E3148',
                                        color: '#F1F5F9'
                                    }}
                                />
                            </div>
                        </div>

                        {/* Email — read only */}
                        <div>
                            <label className="block text-xs mb-1.5"
                                style={{ color: '#94A3B8' }}>
                                Email
                                <span className="ml-1"
                                    style={{ color: '#64748B' }}>
                                    (cannot be changed)
                                </span>
                            </label>
                            <div className="relative">
                                <Mail size={15} color="#64748B"
                                    className="absolute left-3 top-3.5" />
                                <input
                                    type="email"
                                    value={user?.email}
                                    disabled
                                    className="w-full pl-9 pr-4 py-3 rounded-xl 
                                               text-sm outline-none"
                                    style={{
                                        backgroundColor: '#0F1117',
                                        border: '1px solid #2E3148',
                                        color: '#64748B'
                                    }}
                                />
                            </div>
                        </div>

                        <button
                            onClick={handleUpdateProfile}
                            disabled={saving}
                            className="w-full py-3 rounded-xl text-sm font-semibold
                                       flex items-center justify-center gap-2"
                            style={{
                                backgroundColor: '#10B981',
                                color: '#ffffff',
                                opacity: saving ? 0.6 : 1
                            }}>
                            <Save size={15} />
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                )}

                {/* Password Tab */}
                {activeTab === 'password' && (
                    <div className="p-4 rounded-2xl space-y-4"
                        style={{ backgroundColor: '#1A1D27',
                                 border: '1px solid #2E3148' }}>

                        {['oldPassword', 'newPassword', 'confirmPassword'].map((field) => (
                            <div key={field}>
                                <label className="block text-xs mb-1.5"
                                    style={{ color: '#94A3B8' }}>
                                    {field === 'oldPassword' ? 'Current Password'
                                        : field === 'newPassword' ? 'New Password'
                                        : 'Confirm New Password'}
                                </label>
                                <div className="relative">
                                    <Lock size={15} color="#64748B"
                                        className="absolute left-3 top-3.5" />
                                    <input
                                        type="password"
                                        name={field}
                                        value={passwordData[field]}
                                        onChange={handlePasswordChange}
                                        placeholder="••••••••"
                                        className="w-full pl-9 pr-4 py-3 rounded-xl 
                                                   text-sm outline-none"
                                        style={{
                                            backgroundColor: '#222536',
                                            border: '1px solid #2E3148',
                                            color: '#F1F5F9'
                                        }}
                                    />
                                </div>
                            </div>
                        ))}

                        <button
                            onClick={handleUpdatePassword}
                            disabled={saving}
                            className="w-full py-3 rounded-xl text-sm font-semibold
                                       flex items-center justify-center gap-2"
                            style={{
                                backgroundColor: '#10B981',
                                color: '#ffffff',
                                opacity: saving ? 0.6 : 1
                            }}>
                            <Lock size={15} />
                            {saving ? 'Updating...' : 'Update Password'}
                        </button>
                    </div>
                )}

            </div>
        </div>
    )
}

export default Profile
