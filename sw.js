/**
 * solosatset - Service Worker Engine v20260902_v215
 * Instant Cache Invalidation, Automatic Update & Network-First Fresh Code Delivery
 */

const CACHE_NAME = 'solosatset-cache-v20260902_v215';
const PRECACHE_ASSETS = [
  './',
  './index.html',
  './toko-saya.html',
  './admin.html',
  './css/styles.css',
  './assets/img/app-logo.png',
  './assets/img/app-splash.png',
  './manifest.json',
  './favicon.ico',
  './favicon.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      await Promise.allSettled(
        PRECACHE_ASSETS.map(async (url) => {
          try {
            const response = await fetch(url, { cache: 'no-cache' });
            if (response && response.status === 200) {
              await cache.put(url, response);
            }
          } catch (err) {
            console.warn(`[SW Precache] Notice for ${url}:`, err.message);
          }
        })
      );
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => Promise.all(
      cacheNames.map((cache) => {
        if (cache !== CACHE_NAME) {
          console.log('[Service Worker] Purging legacy cache:', cache);
          return caches.delete(cache);
        }
        return undefined;
      })
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  if (
    event.request.method !== 'GET' ||
    requestUrl.protocol.startsWith('chrome-extension') ||
    requestUrl.pathname.startsWith('/api/') ||
    requestUrl.hostname.includes('supabase.co') ||
    requestUrl.hostname.includes('identitytoolkit') ||
    requestUrl.hostname.includes('googleapis.com') ||
    requestUrl.hostname.includes('google-analytics') ||
    requestUrl.hostname.includes('googletagmanager')
  ) {
    return;
  }

  if (
    event.request.mode === 'navigate' ||
    requestUrl.pathname.endsWith('.html') ||
    requestUrl.pathname.endsWith('.js') ||
    requestUrl.pathname === '/' ||
    requestUrl.pathname === ''
  ) {
    event.respondWith(
      fetch(event.request, { cache: 'no-cache' })
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone)).catch(() => {});
          }
          return networkResponse;
        })
        .catch(async () => {
          const cachedResponse = await caches.match(event.request);
          if (cachedResponse) return cachedResponse;
          if (event.request.mode === 'navigate') {
            return (await caches.match('./index.html')) || (await caches.match('./')) || new Response('Offline', { status: 503 });
          }
          return new Response('Network connection offline', { status: 503, statusText: 'Offline' });
        })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone)).catch(() => {});
          }
          return networkResponse;
        })
        .catch(() => cachedResponse || new Response('Network connection offline', { status: 503, statusText: 'Offline' }));

      return cachedResponse || fetchPromise;
    })
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
});

self.addEventListener('push', (event) => {
  let data = {
    title: '📢 Pusat Jual Beli Solo Raya',
    body: 'Ada info barang seken dan pembaruan sistem terbaru!',
    icon: './assets/img/app-logo.png?v=2.1',
    image: null,
    badge: './assets/img/app-logo.png?v=2.1',
    url: './',
    tag: 'solosatset-notification'
  };

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch (e) {
      data.body = event.data.text() || data.body;
    }
  }

  const isBu = data.tag && data.tag.includes('bu-');
  const options = {
    body: data.body || data.message,
    icon: data.icon || './assets/img/app-logo.png?v=2.1',
    image: data.image || null,
    badge: data.badge || './assets/img/app-logo.png?v=2.1',
    tag: data.tag || 'solosatset-notification',
    renotify: true,
    requireInteraction: true,
    vibrate: isBu ? [200, 100, 200, 100, 200] : [200, 100, 200],
    dir: 'auto',
    lang: 'id-ID',
    data: {
      url: data.url || './',
      timestamp: data.timestamp || Date.now()
    },
    actions: [
      { action: 'open', title: 'Lihat Iklan 🔥' },
      { action: 'close', title: 'Tutup' }
    ]
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'close') return;

  const targetUrl = (event.notification.data && event.notification.data.url) || './';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes('solosatset') && 'focus' in client) {
          if (client.navigate) client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(targetUrl);
      return undefined;
    })
  );
});
