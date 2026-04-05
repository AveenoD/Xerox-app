/**
 * PWA Utilities
 * Service Worker registration and PWA helper functions
 */

// Register Service Worker
export const registerSW = () => {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('[PWA] SW registered:', registration.scope)
          
          // Handle updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New version available
                console.log('[PWA] New version available')
                // Optionally show update notification to user
              }
            })
          })
        })
        .catch((err) => {
          console.error('[PWA] SW registration failed:', err)
        })
    })
  }
}

// Unregister Service Worker (for debugging)
export const unregisterSW = () => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then((registration) => {
      registration.unregister()
    })
  }
}

// Check if app is installed
export const isAppInstalled = () => {
  return window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone ||
    document.referrer.includes('android-app://')
}

// Request persistent storage
export const requestPersistentStorage = async () => {
  if (navigator.storage && navigator.storage.persist) {
    const isPersistent = await navigator.storage.persist()
    console.log(`[PWA] Persistent storage: ${isPersistent ? 'granted' : 'denied'}`)
    return isPersistent
  }
  return false
}

// Check storage usage
export const checkStorageUsage = async () => {
  if (navigator.storage && navigator.storage.estimate) {
    const estimate = await navigator.storage.estimate()
    const usage = (estimate.usage / 1024 / 1024).toFixed(2)
    const quota = (estimate.quota / 1024 / 1024).toFixed(2)
    const percentUsed = ((estimate.usage / estimate.quota) * 100).toFixed(1)
    
    console.log(`[PWA] Storage: ${usage}MB / ${quota}MB (${percentUsed}%)`)
    return { usage, quota, percentUsed }
  }
  return null
}

// Request push notification permission
export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    console.log('[PWA] Notifications not supported')
    return false
  }
  
  const permission = await Notification.requestPermission()
  return permission === 'granted'
}

// Subscribe to push notifications
export const subscribeToPush = async () => {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.log('[PWA] Push notifications not supported')
    return null
  }
  
  try {
    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(process.env.VITE_VAPID_PUBLIC_KEY || '')
    })
    
    console.log('[PWA] Push subscription:', subscription)
    return subscription
  } catch (err) {
    console.error('[PWA] Push subscription failed:', err)
    return null
  }
}

// Helper: Convert VAPID key
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/')
  
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  
  return outputArray
}

// Sync data when coming back online
export const syncWhenOnline = (callback) => {
  if (navigator.onLine) {
    callback()
  } else {
    window.addEventListener('online', callback, { once: true })
  }
}

// Check online status
export const isOnline = () => navigator.onLine

// Listen for online/offline events
export const listenToNetworkChanges = (onOnline, onOffline) => {
  window.addEventListener('online', onOnline)
  window.addEventListener('offline', onOffline)
  
  // Return cleanup function
  return () => {
    window.removeEventListener('online', onOnline)
    window.removeEventListener('offline', onOffline)
  }
}

// Add to home screen prompt (deprecated but still useful for some browsers)
let deferredPrompt = null

export const listenToBeforeInstallPrompt = (callback) => {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferredPrompt = e
    callback(e)
  })
}

export const promptInstall = async () => {
  if (!deferredPrompt) return false
  
  deferredPrompt.prompt()
  const { outcome } = await deferredPrompt.userChoice
  deferredPrompt = null
  
  return outcome === 'accepted'
}
