/* eslint-disable no-restricted-globals */

const CACHE_NAME = 'terrabella-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
];

// ─── Install ──────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// ─── Activate ─────────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

// ─── Fetch (network-first, cache fallback para navegación) ────────────────────
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request).then((cached) => {
          if (cached) return cached;
          if (event.request.mode === 'navigate') return caches.match('/index.html');
          return new Response('', { status: 408 });
        });
      })
  );
});

// ─── Web Push: notificaciones en background ───────────────────────────────────
self.addEventListener('push', (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: 'TerraBella', body: event.data.text() };
  }

  const title = payload.title || 'TerraBellapp';
  const options = {
    body: payload.body || 'Tienes una nueva notificación.',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    data: payload.data || {},
    vibrate: [100, 50, 100],
    actions: payload.actions || [],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// ─── Clic en notificación push ────────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const url = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      const existingWindow = windowClients.find((w) => w.url.includes(self.location.origin));
      if (existingWindow) {
        existingWindow.focus();
        existingWindow.navigate(url);
      } else {
        clients.openWindow(url);
      }
    })
  );
});

// ─── Mensajes del cliente (ej. SKIP_WAITING) ──────────────────────────────────
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
