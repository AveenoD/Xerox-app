import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    ArrowLeft, Send, Users, Store, Bell,
    AlertCircle, CheckCircle, Info
} from 'lucide-react'
import api from '../../utils/axios.js'

const AdminNotify = () => {
    const [target, setTarget] = useState('vendors')
    const [title, setTitle] = useState('')
    const [body, setBody] = useState('')
    const [sending, setSending] = useState(false)
    const [result, setResult] = useState(null)
    const [error, setError] = useState('')
    
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()
        
        if (!title.trim() || !body.trim()) {
            setError('Title and message are required')
            return
        }

        setSending(true)
        setError('')
        setResult(null)

        try {
            const res = await api.post('/admin/broadcast', {
                target,
                title: title.trim(),
                body: body.trim(),
                data: {
                    type: 'admin_broadcast',
                    sentAt: new Date().toISOString()
                }
            })

            setResult(res.data.data)
            setTitle('')
            setBody('')
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to send notification')
        } finally {
            setSending(false)
        }
    }

    const targetOptions = [
        { value: 'vendors', label: 'All Vendors', icon: Store, description: 'Send to all registered vendors' },
        { value: 'customers', label: 'All Customers', icon: Users, description: 'Send to all registered customers' },
        { value: 'all', label: 'Everyone', icon: Bell, description: 'Send to all users' },
    ]

    return (
        <div className="min-h-screen" style={{ backgroundColor: '#0F1117' }}>
            {/* Header */}
            <div className="sticky top-0 z-10 px-6 py-4" style={{ backgroundColor: '#1A1D27', borderBottom: '1px solid #2E3148' }}>
                <div className="max-w-4xl mx-auto flex items-center gap-4">
                    <button
                        onClick={() => navigate('/admin')}
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: '#2E3148' }}
                    >
                        <ArrowLeft size={20} color="#F1F5F9" />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold" style={{ color: '#F1F5F9' }}>
                            Broadcast Notification
                        </h1>
                        <p className="text-sm" style={{ color: '#64748B' }}>
                            Send FCM notifications to users
                        </p>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto p-6">
                {/* Error */}
                {error && (
                    <div className="mb-6 p-4 rounded-xl flex items-center gap-3"
                        style={{ backgroundColor: '#2D1515', border: '1px solid #EF4444' }}>
                        <AlertCircle size={20} color="#EF4444" />
                        <p style={{ color: '#EF4444' }}>{error}</p>
                    </div>
                )}

                {/* Success */}
                {result && (
                    <div className="mb-6 p-4 rounded-xl flex items-center gap-3"
                        style={{ backgroundColor: '#0D2B1F', border: '1px solid #10B981' }}>
                        <CheckCircle size={20} color="#10B981" />
                        <div>
                            <p style={{ color: '#10B981' }}>Notification sent successfully!</p>
                            <p className="text-sm" style={{ color: '#64748B' }}>
                                Delivered to {result.recipientCount} {result.target}
                            </p>
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Target Selection */}
                    <div>
                        <label className="block text-sm font-medium mb-3" style={{ color: '#94A3B8' }}>
                            Select Recipients
                        </label>
                        <div className="grid grid-cols-3 gap-4">
                            {targetOptions.map(option => {
                                const Icon = option.icon
                                const isSelected = target === option.value
                                
                                return (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={() => setTarget(option.value)}
                                        className={`p-4 rounded-2xl text-left transition-all ${
                                            isSelected ? 'ring-2' : ''
                                        }`}
                                        style={{
                                            backgroundColor: isSelected ? '#0D2B1F' : '#1A1D27',
                                            border: `1px solid ${isSelected ? '#10B981' : '#2E3148'}`,
                                            ringColor: '#10B981'
                                        }}
                                    >
                                        <div className="flex items-center gap-3 mb-2">
                                            <div
                                                className="w-10 h-10 rounded-xl flex items-center justify-center"
                                                style={{ backgroundColor: isSelected ? '#10B981' : '#2E3148' }}
                                            >
                                                <Icon size={20} color={isSelected ? '#ffffff' : '#94A3B8'} />
                                            </div>
                                            <span
                                                className="font-medium"
                                                style={{ color: isSelected ? '#10B981' : '#F1F5F9' }}
                                            >
                                                {option.label}
                                            </span>
                                        </div>
                                        <p className="text-xs" style={{ color: '#64748B' }}>
                                            {option.description}
                                        </p>
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* Title Input */}
                    <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: '#94A3B8' }}>
                            Notification Title
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Enter notification title..."
                            maxLength={100}
                            className="w-full px-4 py-3 rounded-xl outline-none transition-all"
                            style={{
                                backgroundColor: '#1A1D27',
                                border: '1px solid #2E3148',
                                color: '#F1F5F9'
                            }}
                        />
                        <p className="mt-1 text-xs text-right" style={{ color: '#64748B' }}>
                            {title.length}/100
                        </p>
                    </div>

                    {/* Body Input */}
                    <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: '#94A3B8' }}>
                            Message Body
                        </label>
                        <textarea
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                            placeholder="Enter your message..."
                            rows={5}
                            maxLength={500}
                            className="w-full px-4 py-3 rounded-xl outline-none transition-all resize-none"
                            style={{
                                backgroundColor: '#1A1D27',
                                border: '1px solid #2E3148',
                                color: '#F1F5F9'
                            }}
                        />
                        <p className="mt-1 text-xs text-right" style={{ color: '#64748B' }}>
                            {body.length}/500
                        </p>
                    </div>

                    {/* Preview */}
                    {(title || body) && (
                        <div
                            className="p-4 rounded-xl"
                            style={{ backgroundColor: '#1A1D27', border: '1px solid #2E3148' }}
                        >
                            <p className="text-xs mb-2" style={{ color: '#64748B' }}>Preview</p>
                            <div className="p-3 rounded-lg" style={{ backgroundColor: '#0F1117' }}>
                                <p className="font-medium" style={{ color: '#F1F5F9' }}>
                                    {title || 'Notification Title'}
                                </p>
                                <p className="text-sm mt-1" style={{ color: '#94A3B8' }}>
                                    {body || 'Message body will appear here...'}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Info Note */}
                    <div className="flex items-start gap-3 p-4 rounded-xl"
                        style={{ backgroundColor: '#0D1B2B', border: '1px solid #1E3A5F' }}>
                        <Info size={18} color="#3B82F6" className="flex-shrink-0 mt-0.5" />
                        <p className="text-sm" style={{ color: '#3B82F6' }}>
                            Notifications will be sent via FCM (Firebase Cloud Messaging) to all users 
                            who have enabled push notifications. This action cannot be undone.
                        </p>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={sending || !title.trim() || !body.trim()}
                        className="w-full py-4 rounded-xl text-base font-semibold flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
                        style={{ backgroundColor: '#10B981', color: '#ffffff' }}
                    >
                        {sending ? (
                            <>
                                <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" 
                                    style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'white' }} />
                                Sending...
                            </>
                        ) : (
                            <>
                                <Send size={20} />
                                Send Notification
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    )
}

export default AdminNotify
