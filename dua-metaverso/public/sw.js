const CACHE_NAME = 'dua-metaverso-v1';
const DYNAMIC_CACHE = 'dua-metaverso-dynamic-v1';
const DYNAMIC_CACHE_LIMIT = 50;

const PRE_CACHE_ASSETS = [
  '/',
  '/offline',
];

// ---------------------------------------------------------------------------
// INSTALL -- pre-cache critical assets and skip waiting
// ---------------------------------------------------------------------------
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRE_CACHE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// ---------------------------------------------------------------------------
// ACTIVATE -- purge old caches and claim all clients
// ---------------------------------------------------------------------------
self.addEventListener('activate', (event) => {
  const currentCaches = new Set([CACHE_NAME, DYNAMIC_CACHE]);

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((name) => !currentCaches.has(name))
            .map((name) => caches.delete(name))
        )
      )
      .then(() => self.clients.claim())
  );
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Trim a cache to a maximum number of entries by deleting the oldest first.
 */
function trimCache(cacheName, maxEntries) {
  return caches.open(cacheName).then((cache) =>
    cache.keys().then((keys) => {
      if (keys.length <= maxEntries) return;
      // Delete the oldest entry, then recurse until under the limit.
      return cache.delete(keys[0]).then(() => trimCache(cacheName, maxEntries));
    })
  );
}

/**
 * Returns true when the request URL looks like a static asset
 * (JS bundles, CSS, fonts, images).
 */
function isStaticAsset(url) {
  return /\.(?:js|css|woff2?|ttf|eot|otf|png|jpe?g|gif|svg|webp|avif|ico)(\?.*)?$/i.test(
    url.pathname
  );
}

/**
 * Returns true for SSE / streaming endpoints that must never be intercepted.
 */
function isStreamingEndpoint(url) {
  return (
    url.pathname === '/api/chat' ||
    url.pathname === '/api/backstage/events'
  );
}

// ---------------------------------------------------------------------------
// FETCH -- strategy per request type
// ---------------------------------------------------------------------------
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. SSE / streaming endpoints -- pass through untouched.
  if (isStreamingEndpoint(url)) {
    return; // Let the browser handle it natively.
  }

  // 2. API requests -- network only, never cache.
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(request));
    return;
  }

  // 3. Navigation requests -- network first, cache fallback, offline page.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache a clone of the successful response for future fallback.
          const clone = response.clone();
          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(request, clone);
            trimCache(DYNAMIC_CACHE, DYNAMIC_CACHE_LIMIT);
          });
          return response;
        })
        .catch(() =>
          caches
            .match(request)
            .then((cached) => cached || caches.match('/offline'))
        )
    );
    return;
  }

  // 4. Static assets -- stale-while-revalidate.
  if (isStaticAsset(url)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const networkFetch = fetch(request)
          .then((response) => {
            const clone = response.clone();
            caches.open(DYNAMIC_CACHE).then((cache) => {
              cache.put(request, clone);
              trimCache(DYNAMIC_CACHE, DYNAMIC_CACHE_LIMIT);
            });
            return response;
          })
          .catch(() => cached); // If network fails and nothing cached, will be undefined.

        // Return cached version immediately while revalidating in the background.
        return cached || networkFetch;
      })
    );
    return;
  }

  // 5. Everything else -- network first, cache fallback.
  event.respondWith(
    fetch(request)
      .then((response) => {
        const clone = response.clone();
        caches.open(DYNAMIC_CACHE).then((cache) => {
          cache.put(request, clone);
          trimCache(DYNAMIC_CACHE, DYNAMIC_CACHE_LIMIT);
        });
        return response;
      })
      .catch(() => caches.match(request))
  );
});
