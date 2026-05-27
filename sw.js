// VLive Pro Service Worker v1.0
const CACHE = 'vlive-pro-v1';
const ASSETS = [
  '/vlive-miniapp/',
  '/vlive-miniapp/index.html',
  '/vlive-miniapp/manifest.json',
  '/vlive-miniapp/icon-192.png',
  '/vlive-miniapp/icon-512.png',
  'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Rajdhani:wght@500;600;700&display=swap',
  'https://telegram.org/js/telegram-web-app.js'
];

// Install — cache assets
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => {
      return cache.addAll(ASSETS).catch(err => {
        console.log('Cache partial fail:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — network first, fallback cache
self.addEventListener('fetch', e => {
  // Skip Firebase requests (always need live data)
  if(e.request.url.includes('firebaseio.com') ||
     e.request.url.includes('firebase') ||
     e.request.url.includes('googleapis.com/identitytoolkit')) {
    return;
  }
  e.respondWith(
    fetch(e.request)
      .then(res => {
        // Cache successful responses
        if(res && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE).then(cache => cache.put(e.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});

// Push notifications
self.addEventListener('push', e => {
  const data = e.data?.json() || {};
  const title = data.title || 'VLive Pro';
  const opts = {
    body: data.body || 'New alert',
    icon: '/vlive-miniapp/icon-192.png',
    badge: '/vlive-miniapp/icon-192.png',
    tag: data.tag || 'vlive',
    data: { url: data.url || '/vlive-miniapp/' },
    vibrate: [200, 100, 200],
    requireInteraction: data.urgent || false
  };
  e.waitUntil(self.registration.showNotification(title, opts));
});

// Notification click
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    clients.openWindow(e.notification.data?.url || '/vlive-miniapp/')
  );
});
