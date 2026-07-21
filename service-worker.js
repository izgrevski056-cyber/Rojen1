const CACHE_NAME = 'rozhen1-v3';
const ASSETS = [
  './',
  './index.html',
  './css/styles.css',
  './js/app.js',
  './js/auth.js',
  './js/firebase.js',
  './js/firebase-config.js',
  './js/roles.js',
  './js/storage.js',
  './js/calculations.js',
  './js/views/daily.js',
  './js/views/archive.js',
  './js/views/settings.js',
  './js/views/admin.js',
  './manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  if (event.request.method !== 'GET') return;
  if (url.hostname.includes('googleapis.com') || url.hostname.includes('gstatic.com')) return;
  if (url.hostname.includes('firebaseio.com') || url.hostname.includes('firebaseapp.com')) return;
  if (url.hostname.includes('cloudfunctions.net')) return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      const fetchPromise = fetch(event.request)
        .then(response => {
          if (response.ok && url.origin === self.location.origin) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => cached);

      return cached || fetchPromise;
    })
  );
});
