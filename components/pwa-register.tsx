"use client"

import { useEffect } from "react"

export function PWARegister() {
  useEffect(() => {
    // Service worker is enabled - it now properly ignores Next.js assets
    const ENABLE_SERVICE_WORKER = true
    
    if (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      ENABLE_SERVICE_WORKER
    ) {
      // Check if we need to clear cache (only on first load or if there are 404 errors)
      const shouldClearCache = () => {
        // Check if there's a flag in sessionStorage indicating cache issues
        const cacheIssue = sessionStorage.getItem('sw_cache_issue')
        if (cacheIssue === 'true') {
          sessionStorage.removeItem('sw_cache_issue')
          return true
        }
        return false
      }

      // Clear all caches and unregister old service workers if needed
      const clearOldCache = async () => {
        try {
          // Unregister all service workers
          const registrations = await navigator.serviceWorker.getRegistrations()
          await Promise.all(registrations.map(reg => reg.unregister()))
          
          // Clear all caches
          const cacheNames = await caches.keys()
          await Promise.all(cacheNames.map(cacheName => caches.delete(cacheName)))
          console.log('Cache cleared successfully')
        } catch (error) {
          console.log('Error clearing cache:', error)
        }
      }

      // Register service worker
      window.addEventListener('load', async () => {
        // Only clear cache if there's an issue
        if (shouldClearCache()) {
          await clearOldCache()
          // Small delay to ensure cache is cleared
          await new Promise(resolve => setTimeout(resolve, 100))
        }
        
        navigator.serviceWorker
          .register('/sw.js', { updateViaCache: 'none' })
          .then((registration) => {
            console.log('Service Worker registered successfully:', registration.scope)
            
            // Check for updates immediately
            registration.update()
            
            // Listen for updates
            registration.addEventListener('updatefound', () => {
              const newWorker = registration.installing
              if (newWorker) {
                newWorker.addEventListener('statechange', () => {
                  if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    // New service worker available, reload to activate
                    window.location.reload()
                  }
                })
              }
            })
          }).catch((error) => {
            console.log('Service Worker registration failed:', error)
          })
      })

      // Detect 404 errors and flag for cache clear on next load
      window.addEventListener('error', (event) => {
        if (event.target && (event.target as any).src) {
          const src = (event.target as any).src
          if (src.includes('/_next/') && event.message.includes('404')) {
            sessionStorage.setItem('sw_cache_issue', 'true')
            console.log('Detected 404 error for Next.js asset, will clear cache on next load')
          }
        }
      }, true)

      // Check for updates
      let refreshing = false
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (refreshing) return
        refreshing = true
        window.location.reload()
      })
    }
  }, [])

  return null
}

