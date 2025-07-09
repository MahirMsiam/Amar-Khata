// This is the simplest possible service worker to make the app installable.
// Firestore persistence will handle the offline data caching.

const CACHE_NAME = 'amar-khata-cache-v1';
const STATIC_ASSETS = [
  '/',
  '/favicon.svg',
  '/logo.svg',
  '/manifest.json',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  // Add more static assets as needed
];

self.addEventListener('install', (e) => {
  console.log('[Service Worker] Install');
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
});

self.addEventListener('activate', (e) => {
  console.log('[Service Worker] Activate');
  e.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))
      );
    })
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.mode === 'navigate') {
    // Network first for navigation requests
    e.respondWith(
      fetch(e.request).catch(() => caches.match('/'))
    );
  } else if (STATIC_ASSETS.some((url) => e.request.url.endsWith(url))) {
    // Cache first for static assets
    e.respondWith(
      caches.match(e.request).then((response) => {
        return response || fetch(e.request);
      })
    );
  } else {
    // Default: try network, fallback to cache
    e.respondWith(
      fetch(e.request).catch(() => caches.match(e.request))
    );
  }
});
