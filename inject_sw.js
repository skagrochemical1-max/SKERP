const fs = require('fs');
let content = fs.readFileSync('assets/js/app.js', 'utf8');
if (!content.includes('serviceWorker')) {
  const swCode = \
// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const isPagesDir = window.location.pathname.includes('/pages/');
    const swUrl = isPagesDir ? '../sw.js' : './sw.js';
    navigator.serviceWorker.register(swUrl).catch(err => {
      console.log('SW Registration failed: ', err);
    });
  });
}
\;
  content = swCode + content;
  fs.writeFileSync('assets/js/app.js', content, 'utf8');
}
