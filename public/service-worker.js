const CACHE_NAME = 'task-manager-cache-v4';
const urlsToCache = [
  '/',
  '/index.html',
  '/logo.svg'
];

// Install event: cache assets and activate immediately
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching app shell');
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

// Activate event: clean up old caches and take control
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker: Claiming clients');
      return self.clients.claim();
    })
  );
});

// Fetch event: Network-first strategy
self.addEventListener('fetch', (event) => {
  // Ignore non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return fetch(event.request)
        .then((response) => {
          // If the response was good, clone it and store it in the cache.
          if (response.status === 200) {
            cache.put(event.request.url, response.clone());
          }
          return response;
        })
        .catch((err) => {
          // Network request failed, try to get it from the cache.
          return cache.match(event.request).then(response => {
            return response || Promise.reject('no-match');
          });
        });
    })
  );
});