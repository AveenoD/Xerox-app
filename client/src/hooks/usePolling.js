import { useEffect, useRef, useState } from 'react'

const usePolling = (callback, interval = 15000, enabled = true) => {
    const savedCallback = useRef(callback)
    const [isVisible, setIsVisible] = useState(!document.hidden)

    useEffect(() => {
        savedCallback.current = callback
    }, [callback])

    // Track page visibility
    useEffect(() => {
        const handleVisibilityChange = () => {
            setIsVisible(!document.hidden)
        }

        document.addEventListener('visibilitychange', handleVisibilityChange)
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
    }, [])

    useEffect(() => {
        if (!enabled || !isVisible) return

        // Immediately call once when becoming visible
        savedCallback.current()

        const timer = setInterval(() => {
            savedCallback.current()
        }, interval)

        return () => clearInterval(timer)
    }, [interval, enabled, isVisible])
}

export default usePolling