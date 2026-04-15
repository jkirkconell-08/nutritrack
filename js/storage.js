/* =========================================================
   NutriTrack - Capa de Persistencia (localStorage) v3
   ========================================================= */

const Storage = {
  PREFIX: 'nutritrack_',
  PESO_KEY: 'nutritrack_peso',
  CONFIG_KEY: 'nutritrack_config',
  NOTIF_SENT_KEY: 'nutritrack_notif_sent',
  COMIDAS_PREFIX: 'nutritrack_comidas_',
  WATER_PREFIX: 'nutritrack_water_',
  EJERCICIOS_PREFIX: 'nutritrack_ejercicios_',
  MEDIDAS_KEY: 'nutritrack_medidas',

  /* ---------- helpers ---------- */
  _monthKey(fecha) {
    const d = new Date(fecha + 'T12:00:00');
    return `${this.PREFIX}${d.getFullYear()}_${String(d.getMonth() + 1).padStart(2, '0')}`;
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
    localStorage.setItem(this.COMIDAS_PREFIX + fecha, JSON.stringify(data));
  },

  obtenerComidas(fecha) {
    const raw = localStorage.getItem(this.COMIDAS_PREFIX + fecha);
    return raw ? JSON.parse(raw) : { fecha, comidas: [] };
  },

  /* ---------- agua ---------- */
  guardarAgua(fecha, data) {
    localStorage.setItem(this.WATER_PREFIX + fecha, JSON.stringify(data));
  },

  obtenerAgua(fecha) {
    const raw = localStorage.getItem(this.WATER_PREFIX + fecha);
    if (raw) return JSON.parse(raw);
    return { fecha, vasos: 0, meta: 8, log: [] };
  },

  agregarVasoAgua(fecha) {
    const data = this.obtenerAgua(fecha);
    data.vasos++;
    const now = new Date();
    data.log.push(`${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`);
    this.guardarAgua(fecha, data);
    return data;
  },

  quitarVasoAgua(fecha) {
    const data = this.obtenerAgua(fecha);
    if (data.vasos > 0) {
      data.vasos--;
      data.log.pop();
      this.guardarAgua(fecha, data);
    }
    return data;
  },

  /* ---------- ejercicios ---------- */
  guardarEjercicios(fecha, data) {
    localStorage.setItem(this.EJERCICIOS_PREFIX + fecha, JSON.stringify(data));
  },

  obtenerEjercicios(fecha) {
    const raw = localStorage.getItem(this.EJERCICIOS_PREFIX + fecha);
    return raw ? JSON.parse(raw) : { fecha, ejercicios: [], duracion: 0, nota: '' };
  },

  /* ---------- medidas corporales ---------- */
  guardarMedidas(data) {
    localStorage.setItem(this.MEDIDAS_KEY, JSON.stringify(data));
  },

  obtenerMedidas() {
    const raw = localStorage.getItem(this.MEDIDAS_KEY);
    return raw ? JSON.parse(raw) : { registros: [] };
  },

  agregarMedida(medida) {
    const data = this.obtenerMedidas();
    const idx = data.registros.findIndex(r => r.fecha === medida.fecha);
    if (idx >= 0) data.registros[idx] = medida;
    else data.registros.push(medida);
    data.registros.sort((a, b) => b.fecha.localeCompare(a.fecha));
    this.guardarMedidas(data);
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
    return { registros: [{ fecha: '2026-04-06', peso: 106.7, semana: 1 }] };
  },

  /* ---------- config ---------- */
  guardarConfig(cfg) { localStorage.setItem(this.CONFIG_KEY, JSON.stringify(cfg)); },

  obtenerConfig() {
    const raw = localStorage.getItem(this.CONFIG_KEY);
    if (raw) { const cfg = JSON.parse(raw); if (!cfg.metaCal) cfg.metaCal = 2200; return cfg; }
    return { nombre: 'Jorge', horaGym: '06:00', diasGym: [1,2,3,4,5], horaCena: '19:00', meta: 84.5, hito: 100, pesoInicial: 106.7, metaCal: 2200 };
  },

  /* ---------- notificaciones ---------- */
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
  getDarkMode() { const v = localStorage.getItem('nutritrack_dark'); return v === null ? true : v === 'true'; },
  setDarkMode(val) { localStorage.setItem('nutritrack_dark', String(val)); },

  /* ---------- racha ---------- */
  calcularRacha() {
    let racha = 0;
    const hoy = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(hoy); d.setDate(d.getDate() - i);
      const fecha = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      const dia = this.obtenerDia(fecha);
      if (!dia) { if (i === 0) continue; break; }
      if ((dia.cumplimiento || 0) >= 70) racha++; else { if (i === 0) continue; break; }
    }
    return racha;
  },

  /* ---------- historial ---------- */
  obtenerHistorial(n = 30) {
    const resultado = []; const hoy = new Date();
    for (let i = 0; i < n; i++) {
      const d = new Date(hoy); d.setDate(d.getDate() - i);
      const fecha = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      resultado.push({ fecha, dia: d.getDay(), data: this.obtenerDia(fecha) });
    }
    return resultado;
  },

  /* ---------- dashboard: datos de la semana ---------- */
  obtenerDatosSemana() {
    const hoy = new Date();
    const diaSemana = hoy.getDay();
    const lunes = new Date(hoy);
    lunes.setDate(hoy.getDate() - (diaSemana === 0 ? 6 : diaSemana - 1));

    const datos = { dias: [], totalCal: 0, totalAgua: 0, diasRegistrados: 0, cumplimientoPromedio: 0, ejerciciosDias: 0 };

    for (let i = 0; i < 7; i++) {
      const d = new Date(lunes); d.setDate(lunes.getDate() + i);
      const fecha = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      const checklist = this.obtenerDia(fecha);
      const comidas = this.obtenerComidas(fecha);
      const agua = this.obtenerAgua(fecha);
      const ejercicios = this.obtenerEjercicios(fecha);

      const calDia = (comidas.comidas || []).reduce((s, c) => s + (c.cal * c.cantidad), 0);
      const cumpl = checklist ? checklist.cumplimiento || 0 : 0;

      if (checklist || comidas.comidas.length > 0) datos.diasRegistrados++;
      datos.totalCal += calDia;
      datos.totalAgua += agua.vasos;
      datos.cumplimientoPromedio += cumpl;
      if (ejercicios.ejercicios.length > 0) datos.ejerciciosDias++;

      datos.dias.push({ fecha, diaSemana: d.getDay(), cal: Math.round(calDia), agua: agua.vasos, cumplimiento: cumpl, ejercicios: ejercicios.ejercicios.length > 0 });
    }

    datos.cumplimientoPromedio = datos.diasRegistrados > 0 ? Math.round(datos.cumplimientoPromedio / 7) : 0;
    datos.promedioCal = datos.diasRegistrados > 0 ? Math.round(datos.totalCal / datos.diasRegistrados) : 0;
    return datos;
  },

  /* ---------- export / import ---------- */
  exportarDatos() {
    const data = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith('nutritrack_') || key === 'nutritrack_dark') data[key] = JSON.parse(localStorage.getItem(key));
    }
    return JSON.stringify(data, null, 2);
  },

  importarDatos(jsonStr) {
    const data = JSON.parse(jsonStr);
    for (const [key, val] of Object.entries(data)) {
      if (key.startsWith('nutritrack_') || key === 'nutritrack_dark') localStorage.setItem(key, JSON.stringify(val));
    }
  }
};
