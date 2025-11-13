const CACHE_NAME = 'terminiyt-v2'
const urlsToCache = [
  '/',
  '/fav-icon.png',
  '/manifest.json',
]

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache)
    })
  )
  self.skipWaiting()
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
  return self.clients.claim()
})

// Fetch event - completely ignore Next.js assets, let browser handle them
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)
  
  // Completely ignore Next.js static assets - don't intercept at all
  // This allows the browser to handle them normally without service worker interference
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/_next/chunks/') ||
    url.pathname.startsWith('/_next/webpack') ||
    url.pathname.startsWith('/_next/') ||
    (url.pathname.includes('/app/') && (url.pathname.endsWith('.js') || url.pathname.endsWith('.css'))) ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css')
  ) {
    // Don't intercept - let the request go through normally
    return
  }
  
  // For other assets, try cache first, then network
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response
      }
      return fetch(event.request).catch(() => {
        return new Response('Network error', { status: 500 })
      })
    })
  )
})

