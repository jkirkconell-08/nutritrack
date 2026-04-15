/* =========================================================
   NutriTrack - Sistema de Notificaciones (PWA compatible)
   Usa Service Worker registration.showNotification()
   + setTimeout con delays precisos
   ========================================================= */

const Notificaciones = {
  SCHEDULE: [
    { id: 'pre_entreno',     hora: '05:45', dias: [1,2,3,4,5], titulo: 'Pre-entreno', msg: 'Preparate! En 15 min el gym. Lleva tu banano o galletas.' },
    { id: 'recordatorio_gym', hora: '05:55', dias: [1,2,3,4,5], titulo: 'Gym', msg: 'El gym te espera en 5 minutos!' },
    { id: 'pesaje',          hora: '06:30', dias: [1],          titulo: 'Pesaje', msg: 'Lunes de pesaje! En ayunas antes del gym.' },
    { id: 'desayuno',        hora: '07:05', dias: [1,2,3,4,5], titulo: 'Desayuno', msg: 'Termino el gym! Desayuna en los proximos 45 min.' },
    { id: 'merienda_am',     hora: '10:00', dias: [0,1,2,3,4,5,6], titulo: 'Merienda', msg: 'Es hora de tu merienda de manana.' },
    { id: 'almuerzo',        hora: '12:30', dias: [0,1,2,3,4,5,6], titulo: 'Almuerzo', msg: 'Hora del almuerzo. Recuerda tu tupper!' },
    { id: 'merienda_pm',     hora: '15:30', dias: [0,1,2,3,4,5,6], titulo: 'Merienda tarde', msg: 'Merienda de tarde. No llegues a la cena con hambre.' },
    { id: 'cena',            hora: '19:00', dias: [0,1,2,3,4,5,6], titulo: 'Cena', msg: 'Hora de cenar. Cena liviana!' },
    { id: 'cierre',          hora: '20:45', dias: [0,1,2,3,4,5,6], titulo: 'Cierre del dia', msg: 'No olvides completar tu checklist y nota de hoy.' }
  ],

  permiso: false,
  timers: [],

  async init() {
    if (!('Notification' in window)) return;

    if (Notification.permission === 'granted') {
      this.permiso = true;
    } else if (Notification.permission !== 'denied') {
      const result = await Notification.requestPermission();
      this.permiso = result === 'granted';
    }

    this._showBanner(!this.permiso);

    if (this.permiso) {
      this._scheduleToday();
      this._registerPeriodicSync();
    }
  },

  async solicitarPermiso() {
    if (!('Notification' in window)) return;
    const result = await Notification.requestPermission();
    this.permiso = result === 'granted';
    this._showBanner(!this.permiso);
    if (this.permiso) {
      this._scheduleToday();
      this._registerPeriodicSync();
    }
  },

  _showBanner(show) {
    const banner = document.getElementById('notif-banner');
    if (banner) banner.style.display = show ? 'flex' : 'none';
  },

  /* Schedule all remaining notifications for today using setTimeout */
  _scheduleToday() {
    // Clear existing timers
    this.timers.forEach(t => clearTimeout(t));
    this.timers = [];

    const now = new Date();
    const dia = now.getDay();
    const config = Storage.obtenerConfig();
    const diasGym = config.diasGym || [1,2,3,4,5];
    const sent = Storage.getNotifSent();

    for (const n of this.SCHEDULE) {
      if (sent[n.id]) continue;

      // Check gym days
      if (['pre_entreno', 'recordatorio_gym', 'desayuno'].includes(n.id)) {
        if (!diasGym.includes(dia)) continue;
      }
      if (!n.dias.includes(dia)) continue;

      // Calculate delay
      const [h, m] = n.hora.split(':').map(Number);
      const target = new Date(now);
      target.setHours(h, m, 0, 0);

      const delay = target.getTime() - now.getTime();
      if (delay < 0) continue; // already passed

      const timer = setTimeout(() => {
        this._send(n.titulo, n.msg);
        Storage.markNotifSent(n.id);
      }, delay);

      this.timers.push(timer);
    }
  },

  /* Register periodic background sync for notifications when app is closed */
  async _registerPeriodicSync() {
    if (!('serviceWorker' in navigator)) return;
    try {
      const reg = await navigator.serviceWorker.ready;

      // Send schedule to SW so it knows when to notify
      if (reg.active) {
        reg.active.postMessage({
          type: 'SET_SCHEDULE',
          schedule: this.SCHEDULE,
          config: Storage.obtenerConfig()
        });
      }

      // Try periodic sync (Chrome only, needs site engagement)
      if ('periodicSync' in reg) {
        const status = await navigator.permissions.query({ name: 'periodic-background-sync' });
        if (status.state === 'granted') {
          await reg.periodicSync.register('check-notifications', {
            minInterval: 60 * 1000
          });
        }
      }
    } catch (e) {
      // periodicSync not available, fall back to setInterval
      this._startFallbackLoop();
    }
  },

  /* Fallback: check every 30s (only works while app is open) */
  _startFallbackLoop() {
    setInterval(() => {
      if (!this.permiso) return;
      const now = new Date();
      const dia = now.getDay();
      const horaActual = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
      const config = Storage.obtenerConfig();
      const diasGym = config.diasGym || [1,2,3,4,5];
      const sent = Storage.getNotifSent();

      for (const n of this.SCHEDULE) {
        if (sent[n.id]) continue;
        if (['pre_entreno', 'recordatorio_gym', 'desayuno'].includes(n.id) && !diasGym.includes(dia)) continue;
        if (!n.dias.includes(dia)) continue;
        if (horaActual !== n.hora) continue;
        this._send(n.titulo, n.msg);
        Storage.markNotifSent(n.id);
      }
    }, 30000);
  },

  /* Send notification via Service Worker (works in PWA) */
  async _send(titulo, body) {
    try {
      const reg = await navigator.serviceWorker.ready;
      await reg.showNotification(`NutriTrack - ${titulo}`, {
        body,
        icon: './icon-192.png',
        badge: './icon-192.png',
        tag: `nutritrack-${titulo}`,
        vibrate: [200, 100, 200],
        requireInteraction: false,
        data: { url: './index.html' }
      });
    } catch (e) {
      // Fallback to Notification API
      try {
        new Notification(`NutriTrack - ${titulo}`, { body, tag: `nutritrack-${titulo}` });
      } catch (e2) { /* silent */ }
    }
  },

  /* Test notification - called from config page */
  async test() {
    if (!this.permiso) {
      await this.solicitarPermiso();
    }
    if (this.permiso) {
      await this._send('Prueba', 'Las notificaciones funcionan correctamente!');
    }
  }
};
