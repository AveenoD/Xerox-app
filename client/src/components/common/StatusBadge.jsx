import { Clock, Package, Printer, CheckCircle, XCircle } from 'lucide-react'

const STATUS_CONFIG = {
    pending:   { label: 'Pending',   color: '#EAB308', bg: '#2D2500', icon: Clock },
    accepted:  { label: 'Accepted',  color: '#3B82F6', bg: '#0D1B2B', icon: Package },
    printing:  { label: 'Printing',  color: '#8B5CF6', bg: '#1A0D2B', icon: Printer },
    completed: { label: 'Completed', color: '#10B981', bg: '#0D2B1F', icon: CheckCircle },
    rejected:  { label: 'Rejected',  color: '#EF4444', bg: '#2D1515', icon: XCircle },
    cancelled: { label: 'Cancelled', color: '#64748B', bg: '#1E293B', icon: XCircle },
}

const StatusBadge = ({ status, size = 'md' }) => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending
    const Icon = config.icon
    const iconSize = size === 'sm' ? 10 : 13
    const textSize = size === 'sm' ? 'text-xs' : 'text-sm'

    return (
        <div className={`flex items-center gap-1.5 px-2.5 py-1 
                         rounded-full w-fit ${textSize}`}
            style={{ backgroundColor: config.bg }}>
            <Icon size={iconSize} color={config.color} />
            <span className="font-medium"
                style={{ color: config.color }}>
                {config.label}
            </span>
        </div>
    )
}

export default StatusBadge