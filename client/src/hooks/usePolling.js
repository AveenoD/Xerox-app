import { useEffect, useRef } from 'react'

const usePolling = (callback, interval = 15000, enabled = true) => {
    const savedCallback = useRef(callback)

    useEffect(() => {
        savedCallback.current = callback
    }, [callback])

    useEffect(() => {
        if(!enabled) return

        // Immediately call once
        savedCallback.current()

        const timer = setInterval(() => {
            savedCallback.current()
        }, interval)

        return () => clearInterval(timer)
    }, [interval, enabled])
}

export default usePolling