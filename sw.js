self.addEventListener('install', (e) => {
  console.log('[Service Worker] Install');
});

self.addEventListener('fetch', (e) => {
  // Allow normal network requests (we don't strictly need offline caching for this PWA shortcut feature)
});
