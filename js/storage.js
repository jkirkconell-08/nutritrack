/* =========================================================
   NutriTrack - Capa de Persistencia (localStorage)
   ========================================================= */

const Storage = {
  PREFIX: 'nutritrack_',
  PESO_KEY: 'nutritrack_peso',
  CONFIG_KEY: 'nutritrack_config',
  NOTIF_SENT_KEY: 'nutritrack_notif_sent',
  COMIDAS_PREFIX: 'nutritrack_comidas_',

  /* ---------- helpers ---------- */
  _monthKey(fecha) {
    const d = new Date(fecha + 'T12:00:00');
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    return `${this.PREFIX}${y}_${m}`;
  },

  today() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  },

  /* ---------- checklist diario ---------- */
  guardarDia(fecha, data) {
    const key = this._monthKey(fecha);
    const mes = JSON.parse(localStorage.getItem(key) || '{}');
    mes[fecha] = data;
    localStorage.setItem(key, JSON.stringify(mes));
  },

  obtenerDia(fecha) {
    const key = this._monthKey(fecha);
    const mes = JSON.parse(localStorage.getItem(key) || '{}');
    return mes[fecha] || null;
  },

  obtenerMes(year, month) {
    const key = `${this.PREFIX}${year}_${String(month).padStart(2,'0')}`;
    return JSON.parse(localStorage.getItem(key) || '{}');
  },

  /* ---------- comidas / calorías ---------- */
  guardarComidas(fecha, data) {
    const key = this.COMIDAS_PREFIX + fecha;
    localStorage.setItem(key, JSON.stringify(data));
  },

  obtenerComidas(fecha) {
    const key = this.COMIDAS_PREFIX + fecha;
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
    return { fecha, comidas: [] };
  },

  /* ---------- peso ---------- */
  guardarPeso(fecha, peso) {
    const data = this.obtenerPesos();
    const startDate = new Date('2026-04-06T12:00:00');
    const current = new Date(fecha + 'T12:00:00');
    const diffDays = Math.floor((current - startDate) / (1000 * 60 * 60 * 24));
    const semana = Math.floor(diffDays / 7) + 1;

    const idx = data.registros.findIndex(r => r.fecha === fecha);
    if (idx >= 0) data.registros.splice(idx, 1);

    data.registros.push({ fecha, peso: parseFloat(peso), semana });
    data.registros.sort((a, b) => a.fecha.localeCompare(b.fecha));
    localStorage.setItem(this.PESO_KEY, JSON.stringify(data));
  },

  obtenerPesos() {
    const raw = localStorage.getItem(this.PESO_KEY);
    if (raw) return JSON.parse(raw);
    return {
      registros: [
        { fecha: '2026-04-06', peso: 106.7, semana: 1 }
      ]
    };
  },

  /* ---------- config ---------- */
  guardarConfig(cfg) {
    localStorage.setItem(this.CONFIG_KEY, JSON.stringify(cfg));
  },

  obtenerConfig() {
    const raw = localStorage.getItem(this.CONFIG_KEY);
    if (raw) {
      const cfg = JSON.parse(raw);
      if (!cfg.metaCal) cfg.metaCal = 2200;
      return cfg;
    }
    return {
      nombre: 'Jorge',
      horaGym: '06:00',
      diasGym: [1, 2, 3, 4, 5],
      horaCena: '19:00',
      meta: 84.5,
      hito: 100,
      pesoInicial: 106.7,
      metaCal: 2200
    };
  },

  /* ---------- notificaciones enviadas hoy ---------- */
  getNotifSent() {
    const raw = localStorage.getItem(this.NOTIF_SENT_KEY);
    if (!raw) return {};
    const data = JSON.parse(raw);
    if (data._fecha !== this.today()) return {};
    return data;
  },

  markNotifSent(id) {
    const data = this.getNotifSent();
    data._fecha = this.today();
    data[id] = true;
    localStorage.setItem(this.NOTIF_SENT_KEY, JSON.stringify(data));
  },

  /* ---------- dark mode ---------- */
  getDarkMode() {
    const v = localStorage.getItem('nutritrack_dark');
    if (v === null) return true;
    return v === 'true';
  },

  setDarkMode(val) {
    localStorage.setItem('nutritrack_dark', String(val));
  },

  /* ---------- racha ---------- */
  calcularRacha() {
    let racha = 0;
    const hoy = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(hoy);
      d.setDate(d.getDate() - i);
      const fecha = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      const dia = this.obtenerDia(fecha);
      if (!dia) { if (i === 0) continue; break; }
      if ((dia.cumplimiento || 0) >= 70) racha++;
      else { if (i === 0) continue; break; }
    }
    return racha;
  },

  /* ---------- historial últimos N días ---------- */
  obtenerHistorial(n = 30) {
    const resultado = [];
    const hoy = new Date();
    for (let i = 0; i < n; i++) {
      const d = new Date(hoy);
      d.setDate(d.getDate() - i);
      const fecha = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      const dia = this.obtenerDia(fecha);
      resultado.push({
        fecha,
        dia: d.getDay(),
        data: dia
      });
    }
    return resultado;
  },

  /* ---------- export / import ---------- */
  exportarDatos() {
    const data = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith('nutritrack_') || key === 'nutritrack_dark') {
        data[key] = JSON.parse(localStorage.getItem(key));
      }
    }
    return JSON.stringify(data, null, 2);
  },

  importarDatos(jsonStr) {
    const data = JSON.parse(jsonStr);
    for (const [key, val] of Object.entries(data)) {
      if (key.startsWith('nutritrack_') || key === 'nutritrack_dark') {
        localStorage.setItem(key, JSON.stringify(val));
      }
    }
  }
};
