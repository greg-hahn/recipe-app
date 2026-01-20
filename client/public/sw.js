/**
 * Service Worker for Recipe App PWA
 * 
 * Features:
 * - Precaching of app shell and static assets
 * - Runtime caching with different strategies
 * - Offline fallback page
 * - Background sync for offline actions (future)
 */

// ----- Cache Configuration -----
const CACHE_VERSION = 'v1';
const STATIC_CACHE = `recipe-app-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `recipe-app-dynamic-${CACHE_VERSION}`;
const IMAGE_CACHE = `recipe-app-images-${CACHE_VERSION}`;

// Files to precache (app shell)
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.webmanifest',
  '/icons/icon-192.svg',
  '/icons/icon-512.svg',
];

// ----- Cache Size Limits -----
const MAX_DYNAMIC_CACHE_SIZE = 50;
const MAX_IMAGE_CACHE_SIZE = 100;

/**
 * Limit cache size by removing oldest entries
 * @param {string} cacheName - Name of the cache
 * @param {number} maxItems - Maximum number of items to keep
 */
const limitCacheSize = async (cacheName, maxItems) => {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  
  if (keys.length > maxItems) {
    // Delete oldest entries (FIFO)
    await cache.delete(keys[0]);
    // Recursively check and delete more if needed
    await limitCacheSize(cacheName, maxItems);
  }
};

// ----- Install Event -----
// Precache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Precaching app shell...');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => {
        // Skip waiting to activate immediately
        return self.skipWaiting();
      })
      .catch((err) => {
        console.error('[SW] Precache failed:', err);
      })
  );
});

// ----- Activate Event -----
// Clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => {
              // Delete caches that don't match current version
              return name.startsWith('recipe-app-') && 
                     name !== STATIC_CACHE && 
                     name !== DYNAMIC_CACHE && 
                     name !== IMAGE_CACHE;
            })
            .map((name) => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => {
        // Take control of all clients immediately
        return self.clients.claim();
      })
  );
});

// ----- Fetch Event -----
// Implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') return;
  
  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith('http')) return;
  
  // ----- Strategy Selection -----
  
  // 1. API requests: Network First with Cache Fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstStrategy(request));
    return;
  }
  
  // 2. Images from TheMealDB: Stale While Revalidate
  if (url.hostname.includes('themealdb.com') && url.pathname.includes('/images/')) {
    event.respondWith(staleWhileRevalidateStrategy(request, IMAGE_CACHE));
    return;
  }
  
  // 3. Navigation requests: Network First with Offline Fallback
  if (request.mode === 'navigate') {
    event.respondWith(navigationStrategy(request));
    return;
  }
  
  // 4. Static assets: Cache First
  if (isStaticAsset(url.pathname)) {
    event.respondWith(cacheFirstStrategy(request));
    return;
  }
  
  // 5. Default: Network with Cache Fallback
  event.respondWith(networkFirstStrategy(request));
});

/**
 * Check if the request is for a static asset
 * @param {string} pathname - URL pathname
 * @returns {boolean}
 */
function isStaticAsset(pathname) {
  const staticExtensions = ['.js', '.css', '.svg', '.png', '.jpg', '.jpeg', '.gif', '.webp', '.woff', '.woff2'];
  return staticExtensions.some(ext => pathname.endsWith(ext));
}

/**
 * Cache First Strategy
 * Best for: Static assets that rarely change
 */
async function cacheFirstStrategy(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('[SW] Cache first fetch failed:', error);
    // Return a fallback or let browser handle the error
    return new Response('Offline', { status: 503 });
  }
}

/**
 * Network First Strategy
 * Best for: API requests and dynamic content
 */
async function networkFirstStrategy(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful responses
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
      
      // Limit cache size
      limitCacheSize(DYNAMIC_CACHE, MAX_DYNAMIC_CACHE_SIZE);
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', request.url);
    
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return error response for API requests
    return new Response(
      JSON.stringify({ error: 'Offline', message: 'No cached data available' }),
      { 
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

/**
 * Stale While Revalidate Strategy
 * Best for: Frequently updated content where showing stale is acceptable
 */
async function staleWhileRevalidateStrategy(request, cacheName = DYNAMIC_CACHE) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  // Fetch from network in background
  const networkPromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone());
        
        // Limit image cache size
        if (cacheName === IMAGE_CACHE) {
          limitCacheSize(IMAGE_CACHE, MAX_IMAGE_CACHE_SIZE);
        }
      }
      return networkResponse;
    })
    .catch((error) => {
      console.log('[SW] Background fetch failed:', error);
      return null;
    });
  
  // Return cached response immediately, or wait for network
  return cachedResponse || networkPromise;
}

/**
 * Navigation Strategy
 * For HTML page navigations with offline fallback
 */
async function navigationStrategy(request) {
  try {
    // Try to fetch from network first
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache the page
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Navigation failed, checking cache:', request.url);
    
    // Try to get from cache
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Try to return the root page from cache (SPA fallback)
    const rootCached = await caches.match('/');
    if (rootCached) {
      return rootCached;
    }
    
    // Last resort: offline page
    const offlinePage = await caches.match('/offline.html');
    
    if (offlinePage) {
      return offlinePage;
    }
    
    // Absolute fallback
    return new Response('Offline', { 
      status: 503,
      headers: { 'Content-Type': 'text/html' }
    });
  }
}

// ----- Message Handler -----
// Handle messages from the main app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      })
    );
  }
});

// ----- Push Notification Handler (for future use) -----
self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  const data = event.data.json();
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'Recipe App', {
      body: data.body || 'You have a new notification',
      icon: '/icons/icon-192.svg',
      badge: '/icons/icon-72.svg',
      tag: data.tag || 'default',
    })
  );
});

console.log('[SW] Service worker loaded');
