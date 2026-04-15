/* =========================================================
   NutriTrack - Service Worker v3
   Cache + Notifications + Periodic Sync
   ========================================================= */

const CACHE_NAME = 'nutritrack-v3';
const ASSETS = [
  './',
  './index.html',
  './dashboard.html',
  './comidas.html',
  './ejercicios.html',
  './progreso.html',
  './historial.html',
  './medidas.html',
  './menu.html',
  './config.html',
  './css/app.css',
  './js/storage.js',
  './js/app.js',
  './js/notifications.js',
  './js/charts.js',
  './js/comidas.js',
  './js/dashboard.js',
  './js/ejercicios.js',
  './js/medidas.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

let notifSchedule = [];
let notifConfig = {};

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => Promise.allSettled(ASSETS.map(a => cache.add(a))))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (event.request.url.includes('cdn.jsdelivr.net')) {
    event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
    return;
  }
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetchPromise = fetch(event.request).then((response) => {
        if (response && response.status === 200) {
          const cloned = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, cloned));
        }
        return response;
      }).catch(() => cached);
      return cached || fetchPromise;
    })
  );
});

self.addEventListener('message', (event) => {
  if (!event.data) return;
  if (event.data.type === 'SHOW_NOTIFICATION') {
    self.registration.showNotification(event.data.title, {
      body: event.data.body, icon: './icon-192.png', badge: './icon-192.png',
      tag: `nutritrack-${Date.now()}`, vibrate: [200, 100, 200], data: { url: './index.html' }
    });
  }
  if (event.data.type === 'SET_SCHEDULE') {
    notifSchedule = event.data.schedule || [];
    notifConfig = event.data.config || {};
  }
});

self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'check-notifications') event.waitUntil(checkAndSendNotifications());
});

async function checkAndSendNotifications() {
  if (notifSchedule.length === 0) return;
  const now = new Date();
  const dia = now.getDay();
  const horaActual = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
  const diasGym = (notifConfig.diasGym || [1,2,3,4,5]);
  for (const n of notifSchedule) {
    if (['pre_entreno','recordatorio_gym','desayuno'].includes(n.id) && !diasGym.includes(dia)) continue;
    if (!n.dias.includes(dia)) continue;
    if (horaActual !== n.hora) continue;
    await self.registration.showNotification(`NutriTrack - ${n.titulo}`, {
      body: n.msg, icon: './icon-192.png', badge: './icon-192.png',
      tag: `nutritrack-${n.id}`, vibrate: [200, 100, 200], data: { url: './index.html' }
    });
  }
}

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || './index.html';
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes('nutritrack') && 'focus' in client) return client.focus();
      }
      return self.clients.openWindow(url);
    })
  );
});
