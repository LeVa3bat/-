self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open('gvozdika-cache-v1').then((cache) => cache.addAll([
      '/',
      '/index.html',
      '/manifest.json',
      '/sw.js',
      '/icon-192.png', // Убедитесь, что иконки доступны
      '/icon-512.png'
    ]))
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((response) => response || fetch(e.request))
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keyList) => Promise.all(
      keyList.map((key) => {
        if (key !== 'gvozdika-cache-v1') return caches.delete(key);
      })
    ))
  );
});
