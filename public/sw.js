/**
 * SOPALOKA — Service Worker Engine v20260902_v216
 * Next.js App Router Compatible Service Worker
 */

const CACHE_NAME = "sopaloka-pwa-v20260902_v216";
const PRECACHE_ASSETS = [
  "/",
  "/admin",
  "/toko-saya",
  "/css/styles.css",
  "/assets/img/app-logo.png",
  "/assets/img/app-splash.png",
  "/manifest.json",
  "/favicon.ico",
  "/favicon.png",
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      await Promise.allSettled(
        PRECACHE_ASSETS.map(async (url) => {
          try {
            const response = await fetch(url, { cache: "no-cache" });
            if (response && response.status === 200) {
              await cache.put(url, response);
            }
          } catch (err) {
            console.warn(`[SW Precache Notice] ${url}:`, err);
          }
        }),
      );
    }),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames.map((cache) => {
            if (cache !== CACHE_NAME) {
              console.log("[Service Worker] Purging obsolete cache:", cache);
              return caches.delete(cache);
            }
            return undefined;
          }),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const requestUrl = new URL(event.request.url);

  // Exclude non-GET, APIs, Auth, Supabase, analytics, and dev hosts from caching
  if (
    requestUrl.hostname === "localhost" ||
    requestUrl.hostname === "127.0.0.1" ||
    requestUrl.hostname === "[::1]" ||
    requestUrl.hostname.endsWith(".local") ||
    event.request.method !== "GET" ||
    requestUrl.protocol.startsWith("chrome-extension") ||
    requestUrl.pathname.startsWith("/api/") ||
    requestUrl.hostname.includes("supabase.co") ||
    requestUrl.hostname.includes("identitytoolkit") ||
    requestUrl.hostname.includes("googleapis.com") ||
    requestUrl.hostname.includes("google-analytics") ||
    requestUrl.hostname.includes("googletagmanager")
  ) {
    return;
  }

  // Next.js static assets (_next/static/...) -> Cache-First Strategy
  if (requestUrl.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;
        return fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
          }
          return networkResponse;
        });
      }),
    );
    return;
  }

  // Navigation requests -> Network-First with cached "/" App Shell offline fallback
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request, { cache: "no-cache" })
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
          }
          return networkResponse;
        })
        .catch(async () => {
          const cachedResponse = await caches.match(event.request);
          if (cachedResponse) return cachedResponse;
          return (
            (await caches.match("/")) ||
            new Response("Offline Shell", { status: 503, statusText: "Offline" })
          );
        }),
    );
    return;
  }

  // Generic static asset requests -> Cache-First with Network fallback
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;
      return fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
        }
        return networkResponse;
      });
    }),
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.action === "skipWaiting") {
    self.skipWaiting();
  }
});

self.addEventListener("push", (event) => {
  let data = {
    title: "📢 SOPALOKA",
    body: "Ada info barang terdekat dan pembaruan aplikasi terbaru!",
    icon: "/assets/img/app-logo.png",
    image: null,
    badge: "/assets/img/app-logo.png",
    url: "/",
    tag: "sopaloka-notification",
  };

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch (e) {
      data.body = event.data.text() || data.body;
    }
  }

  const options = {
    body: data.body || data.message,
    icon: data.icon || "/assets/img/app-logo.png",
    image: data.image || null,
    badge: data.badge || "/assets/img/app-logo.png",
    tag: data.tag || "sopaloka-notification",
    renotify: true,
    requireInteraction: true,
    vibrate: [200, 100, 200],
    dir: "auto",
    lang: "id-ID",
    data: {
      url: data.url || "/",
      timestamp: data.timestamp || Date.now(),
    },
    actions: [
      { action: "open", title: "Buka SOPALOKA 🔥" },
      { action: "close", title: "Tutup" },
    ],
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  if (event.action === "close") return;

  const targetUrl = (event.notification.data && event.notification.data.url) || "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if ((client.url.includes("sopaloka") || client.url.includes("localhost")) && "focus" in client) {
          if (client.navigate) client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(targetUrl);
      return undefined;
    }),
  );
});
