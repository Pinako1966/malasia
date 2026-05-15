/* Service Worker · Malasia & Singapur · cache-first PWA */
const VERSION = 'malasia-v1.0.0';
const CORE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './assets/css/styles.css',
  './assets/js/app.js',
  './data/itinerary.json',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/headers/header_kl.jpg',
  './assets/headers/header_cameron.jpg',
  './assets/headers/header_penang.jpg',
  './assets/headers/header_langkawi.jpg',
  './assets/headers/header_islas.jpg',
  './assets/headers/header_melaka.jpg',
  './assets/headers/header_singapur.jpg',
  'https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;1,9..144,400&family=Inter:wght@300;400;500;600&display=swap',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(VERSION).then(cache => cache.addAll(CORE).catch(() => {}))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // OSM tiles: cache-first with separate bucket
  if (url.hostname.endsWith('tile.openstreetmap.org')) {
    e.respondWith(
      caches.open('osm-tiles').then(cache =>
        cache.match(req).then(hit => hit || fetch(req).then(resp => {
          if (resp.ok) cache.put(req, resp.clone());
          return resp;
        }).catch(() => hit))
      )
    );
    return;
  }

  // PDFs: cache on demand
  if (url.pathname.endsWith('.pdf')) {
    e.respondWith(
      caches.open('pdfs').then(cache =>
        cache.match(req).then(hit => hit || fetch(req).then(resp => {
          if (resp.ok) cache.put(req, resp.clone());
          return resp;
        }))
      )
    );
    return;
  }

  // App shell: cache-first with network fallback
  e.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(resp => {
      if (resp.ok && (url.origin === location.origin || url.hostname.includes('fonts.g') || url.hostname.includes('unpkg'))) {
        const clone = resp.clone();
        caches.open(VERSION).then(c => c.put(req, clone));
      }
      return resp;
    }).catch(() => caches.match('./index.html')))
  );
});
