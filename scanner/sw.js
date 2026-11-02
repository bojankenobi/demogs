/**
 * Grand Slot Club - Staff Scanner Dedicated Standalone Service Worker
 * Scope: /scanner/
 * Completely isolated from main casino game service worker
 */

const SCANNER_CACHE_NAME = 'gsc-staff-scanner-pwa-v1';
const SCANNER_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './manifest.webmanifest',
  '../css/scanner.css',
  '../js/lib/jsQR.js',
  '../assets/symbols/crystal-spade-clean.png',
  '../assets/icons/favicon.png',
  '../assets/icons/icon-192.png',
  '../assets/icons/icon-512.png',
  '../assets/icons/apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(SCANNER_CACHE_NAME).then((cache) => {
      return cache.addAll(SCANNER_ASSETS).catch((err) => {
        console.warn('Scanner PWA precache warning:', err);
      });
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key.startsWith('gsc-staff-scanner-') && key !== SCANNER_CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 1. NEVER intercept API calls or non-GET methods
  if (url.pathname.startsWith('/api/') || event.request.method !== 'GET') {
    return;
  }

  // 2. Navigation requests: Network first with cached index fallback
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(SCANNER_CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match('./') || caches.match('./index.html'))
    );
    return;
  }

  // 3. Static assets: Cache first
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(SCANNER_CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      });
    })
  );
});
