// Service Worker for RZD Energy Calculator PWA
// Handles caching and offline functionality

const CACHE_NAME = 'rzd-calculator-v1.0.0';
const OFFLINE_URL = '/offline.html';

// Files to cache for offline functionality
const STATIC_CACHE_URLS = [
  '/',
  '/index.html',
  '/styles/main.css',
  '/styles/themes.css', 
  '/styles/components.css',
  '/scripts/calculator.js',
  '/scripts/data.js',
  '/scripts/themes.js',
  '/offline.html',
  '/icons/icon.svg',
  '/manifest.json'
];

// Data files to cache
const DATA_CACHE_URLS = [
  '/data/abdulino-kinel.md',
  '/data/abdulino-oktyabrsk.md',
  '/data/abdulino-syzran.md',
  '/data/kinel-abdulino.md',
  '/data/abdulino-dema.md',
  '/data/abdulino-oktyabrsk-south.md',
  '/data/abdulino-syzran-south.md',
  '/data/oktyabrsk-abdulino-south.md',
  '/data/oktyabrsk-abdulino.md',
  '/data/syzran-abdulino-south.md',
  '/data/syzran-abdulino.md',
  '/data/index.json'
];

// All URLs to cache
const CACHE_URLS = [...STATIC_CACHE_URLS, ...DATA_CACHE_URLS];

// Install event - cache resources
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Install');
  
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      console.log('[ServiceWorker] Caching app shell and content');
      
      try {
        await cache.addAll(CACHE_URLS);
        console.log('[ServiceWorker] All resources cached successfully');
      } catch (error) {
        console.error('[ServiceWorker] Failed to cache some resources:', error);
        // Cache essential files individually
        for (const url of STATIC_CACHE_URLS) {
          try {
            await cache.add(url);
          } catch (err) {
            console.warn(`[ServiceWorker] Failed to cache: ${url}`, err);
          }
        }
      }
    })()
  );
  
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activate');
  
  event.waitUntil(
    (async () => {
      // Clean up old caches
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(async (cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[ServiceWorker] Removing old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
      
      // Take control of all clients
      await self.clients.claim();
    })()
  );
});

// Fetch event - serve cached content when offline
self.addEventListener('fetch', (event) => {
  console.log('[ServiceWorker] Fetch', event.request.url);
  
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Skip external requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }
  
  event.respondWith(
    (async () => {
      try {
        // Try to get the response from the network first
        const response = await fetch(event.request);
        
        // If successful, update the cache with the new response
        if (response.status === 200) {
          const cache = await caches.open(CACHE_NAME);
          cache.put(event.request, response.clone());
        }
        
        return response;
      } catch (error) {
        console.log('[ServiceWorker] Network failed, trying cache:', event.request.url);
        
        // Network failed, try to get from cache
        const cachedResponse = await caches.match(event.request);
        
        if (cachedResponse) {
          return cachedResponse;
        }
        
        // If not in cache and it's a navigation request, show offline page
        if (event.request.mode === 'navigate') {
          console.log('[ServiceWorker] Serving offline page');
          return caches.match(OFFLINE_URL);
        }
        
        // For other requests, return a generic offline response
        return new Response('Offline - Content not available', {
          status: 503,
          statusText: 'Service Unavailable',
          headers: new Headers({
            'Content-Type': 'text/plain'
          })
        });
      }
    })()
  );
});

// Background sync for data updates
self.addEventListener('sync', (event) => {
  console.log('[ServiceWorker] Background sync:', event.tag);
  
  if (event.tag === 'update-routes') {
    event.waitUntil(updateRouteData());
  }
});

// Update route data in background
async function updateRouteData() {
  try {
    const cache = await caches.open(CACHE_NAME);
    
    for (const url of DATA_CACHE_URLS) {
      try {
        const response = await fetch(url);
        if (response.ok) {
          await cache.put(url, response.clone());
          console.log(`[ServiceWorker] Updated route data: ${url}`);
        }
      } catch (error) {
        console.warn(`[ServiceWorker] Failed to update route data: ${url}`, error);
      }
    }
  } catch (error) {
    console.error('[ServiceWorker] Error updating route data:', error);
  }
}

// Handle messages from the main app
self.addEventListener('message', (event) => {
  console.log('[ServiceWorker] Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'UPDATE_CACHE') {
    event.waitUntil(updateRouteData());
  }
});

// Push notification handling (for future features)
self.addEventListener('push', (event) => {
  console.log('[ServiceWorker] Push received');
  
  const options = {
    body: 'У вас есть новые обновления калькулятора РЖД',
    icon: '/icons/icon.svg',
    badge: '/icons/icon.svg',
    tag: 'rzd-calculator-update',
    renotify: true,
    requireInteraction: false,
    actions: [
      {
        action: 'open',
        title: 'Открыть калькулятор',
        icon: '/icons/icon.svg'
      },
      {
        action: 'close',
        title: 'Закрыть',
        icon: '/icons/icon.svg'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('Калькулятор РЖД', options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('[ServiceWorker] Notification click:', event.action);
  
  event.notification.close();
  
  if (event.action === 'open') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

console.log('[ServiceWorker] Service Worker loaded successfully');