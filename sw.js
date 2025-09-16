self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open('gvozdika-cache').then((cache) => cache.addAll([
      '/',
      '/index.html',
      // Добавьте другие файлы для кэширования, если есть (CSS, JS, изображения)
    ]))
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((response) => response || fetch(e.request))
  );
});