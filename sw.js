const CACHE_NAME = 'agrochem-erp-v1';
const urlsToCache = [
  '/SKERP/',
  '/SKERP/login.html',
  '/SKERP/index.html',
  '/SKERP/assets/css/style.css',
  '/SKERP/assets/css/dashboard.css',
  '/SKERP/assets/css/tables.css',
  '/SKERP/assets/css/forms.css',
  '/SKERP/assets/css/responsive.css',
  '/SKERP/assets/js/app.js',
  '/SKERP/assets/js/database.js',
  '/SKERP/assets/js/utils.js',
  '/SKERP/assets/js/shared-layout.js'
];

// Install Event: Cache essential files
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

// Activate Event: Cleanup old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event: Network first, fallback to cache
self.addEventListener('fetch', event => {
  // Skip cross-origin requests (like Supabase API calls)
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Network First strategy
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Cache the latest version if successful
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Fallback to cache if network fails
        return caches.match(event.request);
      })
  );
});
