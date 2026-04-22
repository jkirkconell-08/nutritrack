/* =========================================================
   NutriTrack - Gráficas de Progreso (Chart.js)
   ========================================================= */

const Charts = {
  chart: null,

  init() {
    this.renderGrafica();
    this.renderTabla();
    this.renderProgreso();
    this.setupFormulario();
  },

  renderGrafica() {
    const ctx = document.getElementById('peso-chart');
    if (!ctx) return;

    const data = Storage.obtenerPesos();
    const registros = data.registros;
    const config = Storage.obtenerConfig();

    const labels = registros.map(r => {
      const d = new Date(r.fecha + 'T12:00:00');
      return `Sem ${r.semana} (${d.toLocaleDateString('es', { day:'numeric', month:'short' })})`;
    });
    const pesos = registros.map(r => r.peso);

    const isDark = document.body.classList.contains('dark');
    const gridColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
    const textColor = isDark ? '#a0aec0' : '#64748b';

    if (this.chart) this.chart.destroy();

    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Peso (kg)',
            data: pesos,
            borderColor: '#1A6B3C',
            backgroundColor: 'rgba(26,107,60,0.12)',
            fill: true,
            tension: 0.3,
            pointRadius: 6,
            pointBackgroundColor: '#1A6B3C',
            pointBorderColor: isDark ? '#1e293b' : '#fff',
            pointBorderWidth: 3,
            borderWidth: 3
          },
          {
            label: `Meta (${config.meta} kg)`,
            data: Array(labels.length).fill(config.meta),
            borderColor: '#f59e0b',
            borderDash: [8, 4],
            borderWidth: 2,
            pointRadius: 0,
            fill: false
          },
          {
            label: `Hito (${config.hito} kg)`,
            data: Array(labels.length).fill(config.hito),
            borderColor: '#3b82f6',
            borderDash: [4, 4],
            borderWidth: 2,
            pointRadius: 0,
            fill: false
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: { color: textColor, usePointStyle: true, padding: 16 }
          },
          tooltip: {
            backgroundColor: isDark ? '#1e293b' : '#fff',
            titleColor: isDark ? '#e2e8f0' : '#1e293b',
            bodyColor: isDark ? '#a0aec0' : '#64748b',
            borderColor: isDark ? '#334155' : '#e2e8f0',
            borderWidth: 1,
            padding: 12,
            displayColors: false,
            callbacks: {
              label: ctx => `${ctx.parsed.y} kg`
            }
          }
        },
        scales: {
          y: {
            grid: { color: gridColor },
            ticks: { color: textColor, callback: v => v + ' kg' }
          },
          x: {
            grid: { color: gridColor },
            ticks: { color: textColor, maxRotation: 45 }
          }
        }
      }
    });
  },

  renderTabla() {
    const container = document.getElementById('peso-tabla');
    if (!container) return;

    const data = Storage.obtenerPesos();
    const registros = [...data.registros].reverse(); // newest first

    if (registros.length === 0) {
      container.innerHTML = '<p style="text-align:center;color:var(--text-muted);padding:16px;font-size:0.85rem;">Sin registros aún</p>';
      return;
    }

    const allReg = data.registros;
    container.innerHTML = `
      <div style="margin-top:20px;">
        <h3 style="font-size:0.85rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:10px;">Historial</h3>
        <div style="display:flex;flex-direction:column;gap:6px;">
          ${registros.map((r, idx) => {
            const origIdx = allReg.length - 1 - idx;
            const prev = origIdx > 0 ? allReg[origIdx - 1] : null;
            const diff = prev ? (r.peso - prev.peso).toFixed(1) : null;
            const diffColor = diff === null ? '' : parseFloat(diff) < 0 ? '#30D158' : parseFloat(diff) > 0 ? '#FF453A' : 'var(--text-muted)';
            const diffText = diff === null ? '' : (parseFloat(diff) > 0 ? '+' : '') + diff + ' kg';
            const d = new Date(r.fecha + 'T12:00:00');
            const fechaStr = d.toLocaleDateString('es', { day:'numeric', month:'short', year:'numeric' });
            return `
              <div style="display:flex;justify-content:space-between;align-items:center;background:var(--bg-input);border-radius:10px;padding:10px 14px;">
                <div>
                  <div style="font-weight:700;font-size:0.9rem;">${r.peso} kg</div>
                  <div style="font-size:0.75rem;color:var(--text-muted);margin-top:2px;">${fechaStr}</div>
                </div>
                ${diff !== null ? `<div style="font-size:0.82rem;font-weight:700;color:${diffColor};">${diffText}</div>` : '<div style="font-size:0.75rem;color:var(--text-muted);">Inicial</div>'}
              </div>`;
          }).join('')}
        </div>
      </div>
    `;
  },

  renderProgreso() {
    const config = Storage.obtenerConfig();
    const data = Storage.obtenerPesos();
    const registros = data.registros;
    const pesoActual = registros.length > 0 ? registros[registros.length - 1].peso : config.pesoInicial;
    const pesoInicial = config.pesoInicial || pesoActual;
    const meta = config.meta || pesoActual;

    const totalPerder = Math.abs(pesoInicial - meta);
    const progreso = totalPerder > 0 ? Math.max(0, Math.min(100, (Math.abs(pesoInicial - pesoActual) / totalPerder) * 100)) : 0;
    const faltaMeta = (pesoActual - meta).toFixed(1);

    // Stats row
    const statsEl = document.getElementById('progreso-stats');
    if (statsEl) {
      statsEl.innerHTML = `
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:16px;">
          <div style="background:var(--bg-input);border-radius:14px;padding:14px 10px;text-align:center;">
            <div style="font-size:1.5rem;font-weight:900;">${pesoActual}</div>
            <div style="font-size:0.7rem;color:var(--text-muted);font-weight:700;text-transform:uppercase;margin-top:2px;">kg actual</div>
          </div>
          <div style="background:rgba(124,58,237,0.12);border:1px solid rgba(124,58,237,0.2);border-radius:14px;padding:14px 10px;text-align:center;">
            <div style="font-size:1.5rem;font-weight:900;color:#A78BFA;">${progreso.toFixed(0)}%</div>
            <div style="font-size:0.7rem;color:var(--text-muted);font-weight:700;text-transform:uppercase;margin-top:2px;">Avance</div>
          </div>
          <div style="background:var(--bg-input);border-radius:14px;padding:14px 10px;text-align:center;">
            <div style="font-size:1.5rem;font-weight:900;">${Math.abs(faltaMeta)}</div>
            <div style="font-size:0.7rem;color:var(--text-muted);font-weight:700;text-transform:uppercase;margin-top:2px;">kg ${parseFloat(faltaMeta) > 0 ? 'faltan' : 'logrado'}</div>
          </div>
        </div>
      `;
    }

    // Progress bar
    const barEl = document.getElementById('progress-bar');
    if (barEl) {
      barEl.innerHTML = `
        <div style="background:var(--bg-input);border-radius:8px;height:10px;overflow:hidden;margin-bottom:8px;">
          <div style="height:100%;width:${progreso}%;background:linear-gradient(90deg,#7C3AED,#A78BFA);border-radius:8px;transition:width 0.6s;"></div>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:0.72rem;color:var(--text-muted);">
          <span>${pesoInicial} kg (inicio)</span><span>Meta: ${meta} kg</span>
        </div>
      `;
    }
  },

  setupFormulario() {
    // IDs que existen en progreso.html
    const inputPeso  = document.getElementById('peso-input');
    const btnGuardar = document.getElementById('btn-registrar-peso');
    const msgDia     = document.getElementById('peso-dia-msg');

    if (!btnGuardar || !inputPeso) return;

    // Permitir registrar cualquier día (no solo lunes)
    if (msgDia) {
      const hoy = new Date();
      const esLunes = hoy.getDay() === 1;
      msgDia.textContent = esLunes
        ? 'Hoy es lunes — buen momento para pesarse en ayunas'
        : 'Puedes registrar tu peso en cualquier momento';
      msgDia.style.display = 'block';
    }

    btnGuardar.addEventListener('click', () => {
      const peso = parseFloat(inputPeso.value);
      if (isNaN(peso) || peso < 20 || peso > 400) {
        if (typeof showToast === 'function') showToast('Ingresa un peso válido (20-400 kg)', 'warning');
        return;
      }

      const fecha = Storage.today();
      Storage.guardarPeso(fecha, peso);

      this.renderGrafica();
      this.renderProgreso();
      this.renderTabla();

      inputPeso.value = '';
      if (typeof showToast === 'function') showToast(`Peso registrado: ${peso} kg`);
    });

    // Allow Enter key
    inputPeso.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') btnGuardar.click();
    });
  }
};
