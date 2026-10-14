/**
 * IGT 3D Casino Slot - PWA Service Worker
 */
const CACHE_NAME = 'grandslot-v3';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './admin.html',
  './css/style.css',
  './css/admin.css',
  './js/audio.js',
  './js/i18n.js',
  './js/particles.js',
  './js/core/player-tracker.js',
  './js/core/wallet.js',
  './js/core/jackpots.js',
  './js/core/meters.js',
  './js/core/gamble.js',
  './js/core/math-manager.js',
  './js/core/notifications.js',
  './js/core/admin-bridge.js',
  './js/admin-dashboard.js',
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

// Push Notification Event Listener (Web Push API)
self.addEventListener('push', (event) => {
  let data = {
    title: 'GRANDSLOT CLUB 🎰',
    body: 'Džekpot fond raste! Zavrtite dobitni spin!',
    icon: './assets/icons/icon-192.png',
    badge: './assets/icons/favicon.png',
    data: { url: './' }
  };

  if (event.data) {
    try {
      data = Object.assign(data, event.data.json());
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || './assets/icons/icon-192.png',
    badge: data.badge || './assets/icons/favicon.png',
    vibrate: [200, 100, 200],
    data: data.data || { url: './' },
    actions: [
      { action: 'open', title: '🎰 Zaigraj Odmah' },
      { action: 'close', title: 'Zatvori' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification Click Handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'close') return;

  const targetUrl = (event.notification.data && event.notification.data.url) || './';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
