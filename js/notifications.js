/* =========================================================
   NutriTrack - Sistema de Notificaciones (sin servidor)
   Usa la Notification API del navegador + setInterval
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
  intervalo: null,

  async init() {
    if (!('Notification' in window)) return;

    if (Notification.permission === 'granted') {
      this.permiso = true;
    } else if (Notification.permission !== 'denied') {
      const result = await Notification.requestPermission();
      this.permiso = result === 'granted';
    }

    this._showBanner(!this.permiso);
    this._startLoop();
  },

  async solicitarPermiso() {
    if (!('Notification' in window)) return;
    const result = await Notification.requestPermission();
    this.permiso = result === 'granted';
    this._showBanner(!this.permiso);
  },

  _showBanner(show) {
    const banner = document.getElementById('notif-banner');
    if (banner) banner.style.display = show ? 'flex' : 'none';
  },

  _startLoop() {
    // Check every 30 seconds
    this.intervalo = setInterval(() => this._check(), 30000);
    this._check(); // run once immediately
  },

  _check() {
    if (!this.permiso) return;

    const now = new Date();
    const dia = now.getDay(); // 0=dom, 1=lun...
    const horaActual = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;

    const config = Storage.obtenerConfig();
    const diasGym = config.diasGym || [1,2,3,4,5];

    const sent = Storage.getNotifSent();

    for (const n of this.SCHEDULE) {
      if (sent[n.id]) continue; // already sent today

      // Check if gym-related notification and it's not a gym day
      if (['pre_entreno', 'recordatorio_gym', 'desayuno'].includes(n.id)) {
        if (!diasGym.includes(dia)) continue;
      }

      if (!n.dias.includes(dia)) continue;
      if (horaActual !== n.hora) continue;

      // Send notification
      this._send(n.titulo, n.msg);
      Storage.markNotifSent(n.id);
    }
  },

  _send(titulo, body) {
    try {
      new Notification(`NutriTrack - ${titulo}`, {
        body,
        icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="12" fill="%231A6B3C"/><text x="32" y="44" font-size="36" text-anchor="middle" fill="white" font-family="Arial">N</text></svg>',
        badge: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="12" fill="%231A6B3C"/><text x="32" y="44" font-size="36" text-anchor="middle" fill="white" font-family="Arial">N</text></svg>',
        tag: `nutritrack-${titulo}`,
        requireInteraction: false
      });
    } catch (e) {
      // Service worker notification fallback
      if (navigator.serviceWorker && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'SHOW_NOTIFICATION',
          title: `NutriTrack - ${titulo}`,
          body
        });
      }
    }
  }
};
