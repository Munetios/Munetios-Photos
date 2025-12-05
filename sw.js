const CACHE_NAME = 'munetios-photos-cache-v1';
const FILES_TO_CACHE = [
    '/',
    '/index.html',
    '/manifest.json',
    '/icon-192.png',
    '/icon-512.png',
    '/image.png',
    'https://api.munetios.com/beautiful-css/beautiful.css',
];

// Install event: cache files
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(FILES_TO_CACHE))
            .then(() => self.skipWaiting())
    );
});

// Activate event: clean up old caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(
                keys.filter(key => key !== CACHE_NAME)
                        .map(key => caches.delete(key))
            )
        ).then(() => self.clients.claim())
    );
});

// Fetch event: serve from cache, then network fallback and update cache
self.addEventListener('fetch', event => {
    if (event.request.method !== 'GET') return;

    event.respondWith(
        caches.match(event.request)
            .then(cachedResponse => {
                const fetchPromise = fetch(event.request)
                    .then(networkResponse => {
                        // Update cache with latest version
                        if (networkResponse && networkResponse.status === 200) {
                            caches.open(CACHE_NAME).then(cache => {
                                cache.put(event.request, networkResponse.clone());
                            });
                        }
                        return networkResponse;
                    })
                    .catch(() => cachedResponse); // If network fails, use cache

                // Return cached response immediately if available, else wait for network
                return cachedResponse || fetchPromise;
            })
    );

});
