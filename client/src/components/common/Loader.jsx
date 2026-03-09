const Loader = ({ fullScreen = true }) => {
    if(fullScreen) return (
        <div className="min-h-screen flex items-center justify-center"
            style={{ backgroundColor: '#0F1117' }}>
            <div className="flex flex-col items-center gap-3">
                <div className="w-9 h-9 rounded-full border-2 animate-spin"
                    style={{ borderColor: '#10B981',
                             borderTopColor: 'transparent' }} />
                <p className="text-sm" style={{ color: '#64748B' }}>
                    Loading...
                </p>
            </div>
        </div>
    )

    return (
        <div className="flex items-center justify-center py-10">
            <div className="w-7 h-7 rounded-full border-2 animate-spin"
                style={{ borderColor: '#10B981',
                         borderTopColor: 'transparent' }} />
        </div>
    )
}

export default Loader