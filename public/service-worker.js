/* eslint-disable no-restricted-globals */

const CACHE_VERSION = 'v2';
const STATIC_CACHE  = `terrabella-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `terrabella-dynamic-${CACHE_VERSION}`;

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// Supabase / API origins we never cache
const API_ORIGINS = [
  'supabase.co',
  'supabase.com',
];

const isApiRequest = (url) => API_ORIGINS.some(o => url.includes(o));
const isStaticAsset = (url) => /\.(js|css|woff2?|png|svg|ico|webp|jpg|jpeg)(\?|$)/.test(url);

// ─── Install ──────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// ─── Activate: limpiar cachés viejos ─────────────────────────────────────────
self.addEventListener('activate', (event) => {
  const CURRENT = new Set([STATIC_CACHE, DYNAMIC_CACHE]);
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter(k => !CURRENT.has(k)).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// ─── Fetch ────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = request.url;

  // API calls: network-only (never cache auth tokens or live data)
  if (isApiRequest(url)) return;

  // Static assets: cache-first
  if (isStaticAsset(url)) {
    event.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached;
        return fetch(request).then(response => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(STATIC_CACHE).then(cache => cache.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // Navigation & rest: network-first, dynamic cache fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(DYNAMIC_CACHE).then(cache => cache.put(request, clone));
        }
        return response;
      })
      .catch(() =>
        caches.match(request).then(cached => {
          if (cached) return cached;
          if (request.mode === 'navigate') return caches.match('/index.html');
          return new Response(
            JSON.stringify({ error: 'Sin conexión' }),
            { status: 503, headers: { 'Content-Type': 'application/json' } }
          );
        })
      )
  );
});

// ─── Web Push ─────────────────────────────────────────────────────────────────
self.addEventListener('push', (event) => {
  if (!event.data) return;

  let payload;
  try { payload = event.data.json(); }
  catch { payload = { title: 'TerraBella', body: event.data.text() }; }

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

// ─── Clic en notificación ─────────────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      const existing = windowClients.find(w => w.url.includes(self.location.origin));
      if (existing) { existing.focus(); existing.navigate(url); }
      else clients.openWindow(url);
    })
  );
});

// ─── Mensajes del cliente ─────────────────────────────────────────────────────
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});
