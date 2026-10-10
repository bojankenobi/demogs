/**
 * IGT 3D Casino Slot - PWA Service Worker
 */
const CACHE_NAME = 'igt-slot-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './css/style.css',
  './js/audio.js',
  './js/i18n.js',
  './js/particles.js',
  './js/core/player-tracker.js',
  './js/core/wallet.js',
  './js/core/jackpots.js',
  './js/core/meters.js',
  './js/core/gamble.js',
  './js/core/math-manager.js',
  './js/core/admin.js',
  './js/core/lobby.js',
  './js/games/classic/symbols.js',
  './js/games/classic/classic.js',
  './js/games/royal3x3/symbols.js',
  './js/games/royal3x3/royal3x3.js',
  './js/games/mines/mines.js',
  './js/games/mines/mini-mines.js',
  './js/app.js',
  './manifest.webmanifest',
  './assets/logo.svg',
  './assets/symbols/logo-flower.svg',
  './assets/symbols/diamond.svg',
  './assets/symbols/bar.svg',
  './assets/symbols/coin.svg',
  './assets/symbols/seven.svg',
  './assets/symbols/bell.svg',
  './assets/symbols/bomb.svg',
  './assets/symbols/crystal-spade-clean.png',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/icons/icon-maskable-512.png',
  './assets/icons/apple-touch-icon.png',
  './assets/icons/favicon.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const isHtml = event.request.mode === 'navigate' || 
                 event.request.headers.get('accept')?.includes('text/html');

  // Network-First for HTML to guarantee immediate updates on reload
  if (isHtml) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return networkResponse;
        })
        .catch(() => caches.match('./index.html', { ignoreSearch: true }))
    );
    return;
  }

  // Cache-First for static assets with background refresh
  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const copy = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        }
        return networkResponse;
      }).catch(() => {});
    })
  );
});
