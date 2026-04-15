/* =========================================================
   NutriTrack - Dashboard Semanal
   ========================================================= */

const Dashboard = {
  init() {
    initDarkMode();
    this._render();
  },

  _render() {
    const container = document.getElementById('dashboard-container');
    if (!container) return;

    const config = Storage.obtenerConfig();
    const datos = Storage.obtenerDatosSemana();
    const pesos = Storage.obtenerPesos();
    const lastPeso = pesos.registros[pesos.registros.length - 1];
    const racha = Storage.calcularRacha();
    const hoy = Storage.today();
    const aguaHoy = Storage.obtenerAgua(hoy);
    const comidasHoy = Storage.obtenerComidas(hoy);
    const calHoy = Math.round((comidasHoy.comidas || []).reduce((s, c) => s + (c.cal * c.cantidad), 0));

    const DIAS_MINI = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

    container.innerHTML = `
      <!-- Saludo -->
      <div class="dash-greeting fade-in">
        <h2>Hola, ${config.nombre} 👋</h2>
        <p>${this._getGreetingMsg()}</p>
      </div>

      <!-- Resumen rápido de hoy -->
      <div class="dash-today fade-in">
        <div class="dash-today-grid">
          <div class="dash-metric">
            <div class="dash-metric-circle cal">
              <span>${calHoy}</span>
            </div>
            <div class="dash-metric-label">kcal hoy</div>
          </div>
          <div class="dash-metric">
            <div class="dash-metric-circle water">
              <span>${aguaHoy.vasos}/${aguaHoy.meta}</span>
            </div>
            <div class="dash-metric-label">vasos agua</div>
          </div>
          <div class="dash-metric">
            <div class="dash-metric-circle streak">
              <span>${racha}</span>
            </div>
            <div class="dash-metric-label">racha</div>
          </div>
          <div class="dash-metric">
            <div class="dash-metric-circle weight">
              <span>${lastPeso.peso}</span>
            </div>
            <div class="dash-metric-label">kg actual</div>
          </div>
        </div>
      </div>

      <!-- Semana: calorías -->
      <div class="dash-card fade-in">
        <div class="dash-card-header">
          <h3>📊 Calorías de la semana</h3>
          <span class="dash-card-badge">Prom: ${datos.promedioCal} kcal</span>
        </div>
        <div class="dash-bar-chart" id="cal-bars">
          ${datos.dias.map((d, i) => {
            const pct = config.metaCal > 0 ? Math.min(100, (d.cal / config.metaCal) * 100) : 0;
            const isToday = d.fecha === hoy;
            const over = d.cal > config.metaCal;
            return `
              <div class="dash-bar-col ${isToday ? 'today' : ''}">
                <div class="dash-bar-val">${d.cal > 0 ? d.cal : '-'}</div>
                <div class="dash-bar-track">
                  <div class="dash-bar-fill ${over ? 'over' : ''}" style="height:${pct}%"></div>
                </div>
                <div class="dash-bar-label">${DIAS_MINI[i]}</div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- Semana: cumplimiento -->
      <div class="dash-card fade-in">
        <div class="dash-card-header">
          <h3>✅ Cumplimiento</h3>
          <span class="dash-card-badge">${datos.cumplimientoPromedio}% prom</span>
        </div>
        <div class="dash-week-dots">
          ${datos.dias.map((d, i) => {
            let cls = 'empty';
            if (d.cumplimiento >= 80) cls = 'green';
            else if (d.cumplimiento >= 50) cls = 'yellow';
            else if (d.cumplimiento > 0) cls = 'red';
            const isToday = d.fecha === hoy;
            return `<div class="dash-dot-col ${isToday ? 'today' : ''}">
              <div class="dash-dot ${cls}">${d.cumplimiento > 0 ? d.cumplimiento + '%' : '-'}</div>
              <span>${DIAS_MINI[i]}</span>
            </div>`;
          }).join('')}
        </div>
      </div>

      <!-- Semana: agua -->
      <div class="dash-card fade-in">
        <div class="dash-card-header">
          <h3>💧 Agua</h3>
          <span class="dash-card-badge">${datos.totalAgua} vasos total</span>
        </div>
        <div class="dash-week-dots">
          ${datos.dias.map((d, i) => {
            const meta = 8;
            let cls = 'empty';
            if (d.agua >= meta) cls = 'green';
            else if (d.agua >= meta * 0.5) cls = 'yellow';
            else if (d.agua > 0) cls = 'red';
            const isToday = d.fecha === hoy;
            return `<div class="dash-dot-col ${isToday ? 'today' : ''}">
              <div class="dash-dot ${cls}">${d.agua > 0 ? d.agua : '-'}</div>
              <span>${DIAS_MINI[i]}</span>
            </div>`;
          }).join('')}
        </div>
      </div>

      <!-- Gym esta semana -->
      <div class="dash-card fade-in">
        <div class="dash-card-header">
          <h3>🏋️ Gym</h3>
          <span class="dash-card-badge">${datos.ejerciciosDias}/7 días</span>
        </div>
        <div class="dash-week-dots">
          ${datos.dias.map((d, i) => {
            const isToday = d.fecha === hoy;
            return `<div class="dash-dot-col ${isToday ? 'today' : ''}">
              <div class="dash-dot ${d.ejercicios ? 'green' : 'empty'}">${d.ejercicios ? '💪' : '-'}</div>
              <span>${DIAS_MINI[i]}</span>
            </div>`;
          }).join('')}
        </div>
      </div>

      <!-- Peso progress -->
      <div class="dash-card fade-in">
        <div class="dash-card-header">
          <h3>⚖️ Progreso de peso</h3>
        </div>
        <div class="dash-peso-summary">
          <div class="dash-peso-num">${lastPeso.peso} <small>kg</small></div>
          <div class="dash-peso-meta">Meta: ${config.meta} kg · Faltan ${(lastPeso.peso - config.meta).toFixed(1)} kg</div>
          <div class="progress-bar-bg" style="height:12px;border-radius:6px;margin-top:10px;">
            <div class="progress-bar-fill" style="width:${Math.min(100, ((config.pesoInicial - lastPeso.peso) / (config.pesoInicial - config.meta)) * 100)}%;height:100%;border-radius:6px;"></div>
          </div>
        </div>
      </div>

      <!-- Compartir -->
      <button id="btn-compartir" class="btn btn-primary btn-full" style="margin-top:8px;">
        📱 Compartir resumen semanal
      </button>
    `;

    document.getElementById('btn-compartir').addEventListener('click', () => this._share(datos, config, lastPeso));
  },

  _getGreetingMsg() {
    const h = new Date().getHours();
    if (h < 12) return 'Buenos días! Empieza tu día con energía.';
    if (h < 18) return 'Buena tarde! ¿Cómo va tu alimentación hoy?';
    return 'Buenas noches! No olvides completar tu registro.';
  },

  /* ─── Compartir como imagen ─── */
  async _share(datos, config, lastPeso) {
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 800;
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = '#0f1923';
    ctx.fillRect(0, 0, 600, 800);

    // Header
    ctx.fillStyle = '#1A6B3C';
    ctx.fillRect(0, 0, 600, 100);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 32px Arial';
    ctx.fillText('NutriTrack', 30, 55);
    ctx.font = '16px Arial';
    ctx.fillText('Resumen Semanal', 30, 80);

    // Stats
    ctx.fillStyle = '#1e2d3d';
    ctx.beginPath(); ctx.roundRect(20, 120, 270, 100, 12); ctx.fill();
    ctx.beginPath(); ctx.roundRect(310, 120, 270, 100, 12); ctx.fill();
    ctx.beginPath(); ctx.roundRect(20, 240, 270, 100, 12); ctx.fill();
    ctx.beginPath(); ctx.roundRect(310, 240, 270, 100, 12); ctx.fill();

    ctx.fillStyle = '#e2e8f0'; ctx.font = 'bold 28px Arial';
    ctx.fillText(`${lastPeso.peso} kg`, 40, 170);
    ctx.fillText(`${datos.promedioCal}`, 330, 170);
    ctx.fillText(`${datos.totalAgua} vasos`, 40, 290);
    ctx.fillText(`${datos.cumplimientoPromedio}%`, 330, 290);

    ctx.fillStyle = '#94a3b8'; ctx.font = '14px Arial';
    ctx.fillText('Peso actual', 40, 200);
    ctx.fillText('Prom. Calorías/día', 330, 200);
    ctx.fillText('Agua esta semana', 40, 320);
    ctx.fillText('Cumplimiento promedio', 330, 320);

    // Bar chart
    const DIAS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
    ctx.fillStyle = '#1e2d3d';
    ctx.beginPath(); ctx.roundRect(20, 370, 560, 220, 12); ctx.fill();

    ctx.fillStyle = '#94a3b8'; ctx.font = 'bold 14px Arial';
    ctx.fillText('Calorías de la semana', 40, 400);

    datos.dias.forEach((d, i) => {
      const x = 50 + i * 76;
      const maxH = 140;
      const pct = config.metaCal > 0 ? Math.min(1, d.cal / config.metaCal) : 0;
      const barH = pct * maxH;

      ctx.fillStyle = d.cal > config.metaCal ? '#ef4444' : '#1A6B3C';
      ctx.beginPath(); ctx.roundRect(x, 420 + maxH - barH, 40, barH, 4); ctx.fill();

      ctx.fillStyle = '#94a3b8'; ctx.font = '12px Arial';
      ctx.fillText(DIAS[i], x + 14, 575);
      if (d.cal > 0) {
        ctx.fillStyle = '#e2e8f0'; ctx.font = '10px Arial';
        ctx.fillText(d.cal.toString(), x + 4, 415 + maxH - barH);
      }
    });

    // Footer
    ctx.fillStyle = '#64748b'; ctx.font = '13px Arial';
    ctx.fillText(`Meta: ${config.meta} kg · ${config.metaCal} kcal/día`, 20, 640);
    ctx.fillStyle = '#1A6B3C'; ctx.font = 'bold 14px Arial';
    ctx.fillText('Generado con NutriTrack 💚', 20, 670);

    // Progress bar
    ctx.fillStyle = '#253443';
    ctx.beginPath(); ctx.roundRect(20, 700, 560, 20, 10); ctx.fill();
    const progPct = Math.min(1, (config.pesoInicial - lastPeso.peso) / (config.pesoInicial - config.meta));
    ctx.fillStyle = '#1A6B3C';
    ctx.beginPath(); ctx.roundRect(20, 700, Math.max(20, 560 * progPct), 20, 10); ctx.fill();

    ctx.fillStyle = '#94a3b8'; ctx.font = '12px Arial';
    ctx.fillText(`${config.pesoInicial} kg → ${config.meta} kg`, 20, 740);

    // Download or share
    canvas.toBlob(async (blob) => {
      if (navigator.share && navigator.canShare) {
        try {
          const file = new File([blob], 'nutritrack-semanal.png', { type: 'image/png' });
          await navigator.share({ title: 'Mi progreso NutriTrack', files: [file] });
        } catch (e) {
          this._downloadBlob(blob);
        }
      } else {
        this._downloadBlob(blob);
      }
    }, 'image/png');
  },

  _downloadBlob(blob) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `nutritrack_semanal_${Storage.today()}.png`;
    a.click(); URL.revokeObjectURL(url);
    showToast('Imagen descargada');
  }
};
