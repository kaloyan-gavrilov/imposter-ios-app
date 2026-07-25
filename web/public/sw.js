// Offline shell for Imposter.
//
// The game has no server component, so once the page and its assets are cached
// the whole thing plays on a plane. Strategy is stale-while-revalidate for
// same-origin GETs: instant loads, with a fresh copy pulled in the background.

const CACHE = 'imposter-v1';
const SHELL = ['/', '/manifest.webmanifest', '/icon-1024.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(SHELL))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(request);

      const network = fetch(request)
        .then((response) => {
          if (response.ok) cache.put(request, response.clone());
          return response;
        })
        .catch(() => cached);

      // Navigations fall back to the cached shell so a cold offline start works.
      if (request.mode === 'navigate') {
        return cached ?? network.then((res) => res ?? cache.match('/'));
      }

      return cached ?? network;
    }),
  );
});
