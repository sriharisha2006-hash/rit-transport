const CACHE_NAME = 'rit-transport-v4';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './rit_college.jpg',
  './logo.png',
  'https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js'
];

// Install Event - Pre-cache critical shell assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Pre-caching offline assets...');
      return cache.addAll(ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event - Clean up stale caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[Service Worker] Removing old cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Stale-while-revalidate for static assets, network-first for external APIs
self.addEventListener('fetch', (event) => {
  // Don't intercept Supabase API requests, external tracking data, or Google Maps scripts/APIs
  if (
    event.request.url.includes('supabase.co') || 
    event.request.url.includes('googleapis.com') || 
    event.request.url.includes('gstatic.com') || 
    event.request.method !== 'GET'
  ) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch fresh copy in the background
        fetch(event.request).then((networkResponse) => {
          if (networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse));
          }
        }).catch(() => {/* Ignore network failures when updating cache in background */});
        
        return cachedResponse;
      }

      return fetch(event.request).then((networkResponse) => {
        // Cache dynamic assets on-the-fly if they are standard GET requests
        if (networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Offline fallback if fetch fails
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
