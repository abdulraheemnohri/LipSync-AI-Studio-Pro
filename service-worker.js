// LipSync AI Studio Pro - Service Worker
// Version: 1.0.0
// Offline-first PWA support

const CACHE_NAME = 'lipsync-ai-studio-pro-v1.0.0';
const ASSETS_CACHE = 'lipsync-assets-v1.0.0';
const DATA_CACHE = 'lipsync-data-v1.0.0';

// Core files to cache for offline use
const CORE_FILES = [
  '/',
  '/index.html',
  '/manifest.json',
  '/css/style.css',
  '/css/animations.css',
  '/js/app.js',
  '/js/audio-engine.js',
  '/js/avatar-engine.js',
  '/js/camera-engine.js',
  '/js/database.js',
  '/js/exporter.js',
  '/js/lipsync-engine.js',
  '/js/settings.js',
  '/js/webllm-engine.js',
  '/assets/avatars/default.svg',
  '/assets/avatars/robot.svg'
];

// Asset files (images, models, etc.)
const ASSET_FILES = [
  '/assets/avatars/default.svg',
  '/assets/avatars/robot.svg',
  '/assets/avatars/default.png',
  '/assets/avatars/robot.png'
];

// External resources to cache
const EXTERNAL_RESOURCES = [
  'https://fonts.googleapis.com/icon?family=Material+Icons',
  'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.11.0/dist/tf.min.js'
];

// Install service worker
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  
  event.waitUntil(
    Promise.all([
      // Cache core files
      caches.open(CACHE_NAME)
        .then((cache) => {
          console.log('[Service Worker] Caching core files...');
          return cache.addAll(CORE_FILES);
        })
        .catch((error) => {
          console.error('[Service Worker] Error caching core files:', error);
        }),
      
      // Cache asset files
      caches.open(ASSETS_CACHE)
        .then((cache) => {
          console.log('[Service Worker] Caching asset files...');
          return cache.addAll(ASSET_FILES);
        })
        .catch((error) => {
          console.error('[Service Worker] Error caching asset files:', error);
        }),
      
      // Cache external resources
      caches.open(DATA_CACHE)
        .then((cache) => {
          console.log('[Service Worker] Caching external resources...');
          return Promise.all(
            EXTERNAL_RESOURCES.map(url => 
              fetch(url)
                .then(response => {
                  if (response.ok) {
                    return cache.put(url, response);
                  }
                  throw new Error(`Failed to fetch: ${url}`);
                })
                .catch(error => {
                  console.warn('[Service Worker] Could not cache external resource:', url, error);
                })
            )
          );
        })
    ])
      .then(() => {
        console.log('[Service Worker] Installation complete!');
        return self.skipWaiting();
      })
  );
});

// Activate service worker
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  
  event.waitUntil(
    Promise.all([
      // Delete old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName !== ASSETS_CACHE && cacheName !== DATA_CACHE) {
              console.log('[Service Worker] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      
      // Take control of all clients
      self.clients.claim()
    ])
      .then(() => {
        console.log('[Service Worker] Activation complete!');
      })
  );
});

// Fetch handler - offline-first strategy
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  const requestUrl = url.pathname;
  
  // Ignore non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Handle API requests - network first
  if (requestUrl.includes('/api/') || requestUrl.includes('github.com')) {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          console.warn('[Service Worker] API request failed, using offline fallback');
          return new Response(JSON.stringify({ error: 'Offline - API unavailable' }), {
            headers: { 'Content-Type': 'application/json' }
          });
        })
    );
    return;
  }
  
  // Handle external resources
  if (EXTERNAL_RESOURCES.some(resource => event.request.url.includes(resource))) {
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          if (response) {
            console.log('[Service Worker] Serving external resource from cache:', event.request.url);
            return response;
          }
          return fetch(event.request)
            .then((fetchResponse) => {
              // Clone and cache the response
              const responseClone = fetchResponse.clone();
              caches.open(DATA_CACHE)
                .then((cache) => {
                  cache.put(event.request, responseClone);
                });
              return fetchResponse;
            })
            .catch(() => {
              console.warn('[Service Worker] External resource failed, using offline fallback');
              return new Response(null, { status: 404 });
            });
        })
    );
    return;
  }
  
  // Handle core files - cache first
  if (CORE_FILES.includes(requestUrl) || CORE_FILES.includes(requestUrl + '/')) {
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          if (response) {
            console.log('[Service Worker] Serving core file from cache:', requestUrl);
            return response;
          }
          return fetch(event.request)
            .then((fetchResponse) => {
              // Clone and cache the response
              const responseClone = fetchResponse.clone();
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, responseClone);
                });
              return fetchResponse;
            })
            .catch(() => {
              console.warn('[Service Worker] Core file failed, using offline fallback');
              return caches.match('/index.html') || new Response(null, { status: 404 });
            });
        })
    );
    return;
  }
  
  // Handle asset files - cache first
  if (ASSET_FILES.includes(requestUrl) || requestUrl.includes('/assets/')) {
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          if (response) {
            console.log('[Service Worker] Serving asset from cache:', requestUrl);
            return response;
          }
          return fetch(event.request)
            .then((fetchResponse) => {
              // Clone and cache the response
              const responseClone = fetchResponse.clone();
              caches.open(ASSETS_CACHE)
                .then((cache) => {
                  cache.put(event.request, responseClone);
                });
              return fetchResponse;
            })
            .catch(() => {
              console.warn('[Service Worker] Asset failed, using offline fallback');
              return new Response(null, { status: 404 });
            });
        })
    );
    return;
  }
  
  // Default - network first with cache fallback
  event.respondWith(
    fetch(event.request)
      .then((fetchResponse) => {
        // Clone and cache successful responses
        if (fetchResponse.ok) {
          const responseClone = fetchResponse.clone();
          caches.open(DATA_CACHE)
            .then((cache) => {
              cache.put(event.request, responseClone);
            });
        }
        return fetchResponse;
      })
      .catch(() => {
        console.warn('[Service Worker] Request failed, using offline fallback');
        return caches.match(event.request)
          || caches.match('/index.html')
          || new Response(null, { status: 404 });
      })
  );
});

// Message handler for cache management
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CACHE_CLEAR') {
    console.log('[Service Worker] Clearing caches...');
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName.startsWith('lipsync')) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[Service Worker] Caches cleared!');
      event.source.postMessage({ type: 'CACHE_CLEARED' });
    });
  }
  
  if (event.data && event.data.type === 'CACHE_UPDATE') {
    console.log('[Service Worker] Updating cache...');
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(CORE_FILES);
      })
      .then(() => {
        console.log('[Service Worker] Cache updated!');
        event.source.postMessage({ type: 'CACHE_UPDATED' });
      });
  }
  
  if (event.data && event.data.type === 'GET_MEMORY_USAGE') {
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          return caches.open(cacheName).then((cache) => {
            return cache.keys().then((keys) => {
              return {
                name: cacheName,
                size: keys.length
              };
            });
          });
        })
      );
    }).then((cacheInfo) => {
      event.source.postMessage({ 
        type: 'MEMORY_USAGE', 
        data: cacheInfo 
      });
    });
  }
});

// Push notification handler
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push notification received');
  
  const data = event.data?.json();
  const title = data?.title || 'LipSync AI Studio Pro';
  const options = {
    body: data?.body || 'New notification',
    icon: '/assets/icons/icon-192x192.png',
    badge: '/assets/icons/icon-72x72.png',
    data: {
      url: data?.url || '/'
    }
  };
  
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification clicked');
  
  event.notification.close();
  
  const url = event.notification.data?.url || '/';
  
  event.waitUntil(
    self.clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then((clients) => {
      if (clients.length > 0) {
        // Focus on existing window
        const client = clients[0];
        client.postMessage({ type: 'NAVIGATE', url });
        return client.focus();
      } else {
        // Open new window
        return self.clients.openWindow(url);
      }
    })
  );
});

// Background sync handler
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Background sync:', event.tag);
  
  if (event.tag === 'sync-data') {
    event.waitUntil(
      // Implement your sync logic here
      console.log('[Service Worker] Syncing data in background...')
    );
  }
});

// Periodic sync handler (if supported)
self.addEventListener('periodicsync', (event) => {
  console.log('[Service Worker] Periodic sync:', event.tag);
  
  if (event.tag === 'update-check') {
    event.waitUntil(
      // Check for updates
      fetch('/version.json?cache=' + Date.now())
        .then(response => response.json())
        .then(data => {
          console.log('[Service Worker] Version check:', data);
        })
        .catch(() => {
          console.log('[Service Worker] Version check failed');
        })
    );
  }
});

console.log('[Service Worker] LipSync AI Studio Pro Service Worker loaded');
