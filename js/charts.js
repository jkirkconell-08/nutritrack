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
    const tbody = document.getElementById('peso-tabla-body');
    if (!tbody) return;

    const data = Storage.obtenerPesos();
    const registros = data.registros;

    tbody.innerHTML = '';
    for (let i = 0; i < registros.length; i++) {
      const r = registros[i];
      const diff = i > 0 ? (r.peso - registros[i-1].peso).toFixed(1) : '—';
      const diffClass = i > 0 ? (parseFloat(diff) < 0 ? 'positivo' : parseFloat(diff) > 0 ? 'negativo' : '') : '';
      const diffIcon = i > 0 ? (parseFloat(diff) < 0 ? '▼' : parseFloat(diff) > 0 ? '▲' : '—') : '';

      const d = new Date(r.fecha + 'T12:00:00');
      const fechaStr = d.toLocaleDateString('es', { day:'numeric', month:'short', year:'numeric' });

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>Semana ${r.semana}</td>
        <td>${fechaStr}</td>
        <td><strong>${r.peso} kg</strong></td>
        <td class="${diffClass}">${diffIcon} ${diff !== '—' ? diff + ' kg' : diff}</td>
      `;
      tbody.appendChild(tr);
    }
  },

  renderProgreso() {
    const el = document.getElementById('peso-progreso');
    if (!el) return;

    const data = Storage.obtenerPesos();
    const config = Storage.obtenerConfig();
    const registros = data.registros;
    const pesoActual = registros.length > 0 ? registros[registros.length - 1].peso : config.pesoInicial;
    const pesoInicial = config.pesoInicial;
    const meta = config.meta;
    const hito = config.hito;

    const totalPerder = pesoInicial - meta;
    const perdido = pesoInicial - pesoActual;
    const porcentaje = Math.max(0, Math.min(100, (perdido / totalPerder * 100))).toFixed(1);
    const faltaHito = (pesoActual - hito).toFixed(1);
    const faltaMeta = (pesoActual - meta).toFixed(1);

    el.innerHTML = `
      <div class="progreso-stats">
        <div class="stat-card">
          <span class="stat-valor">${pesoActual} kg</span>
          <span class="stat-label">Peso actual</span>
        </div>
        <div class="stat-card accent">
          <span class="stat-valor">${porcentaje}%</span>
          <span class="stat-label">Avance a meta</span>
        </div>
        <div class="stat-card">
          <span class="stat-valor">${faltaMeta} kg</span>
          <span class="stat-label">Faltan para ${meta} kg</span>
        </div>
      </div>
      <div class="progress-bar-container">
        <div class="progress-bar-bg">
          <div class="progress-bar-fill" style="width:${porcentaje}%"></div>
          <span class="progress-bar-text">${pesoInicial} kg → ${meta} kg</span>
        </div>
      </div>
      ${pesoActual > hito ? `<p class="hito-msg">Te faltan <strong>${faltaHito} kg</strong> para llegar a los ${hito} kg</p>` : `<p class="hito-msg logrado">Ya pasaste el hito de ${hito} kg!</p>`}
    `;
  },

  setupFormulario() {
    const form = document.getElementById('peso-form');
    if (!form) return;

    const hoy = new Date();
    const esLunes = hoy.getDay() === 1;
    const inputPeso = document.getElementById('input-peso');
    const btnGuardar = document.getElementById('btn-guardar-peso');
    const msgDia = document.getElementById('peso-dia-msg');

    if (!esLunes) {
      if (inputPeso) inputPeso.disabled = true;
      if (btnGuardar) btnGuardar.disabled = true;
      if (msgDia) {
        msgDia.textContent = 'El pesaje es los lunes en ayunas';
        msgDia.style.display = 'block';
      }
    } else {
      if (msgDia) {
        msgDia.textContent = 'Hoy es lunes — registra tu peso en ayunas';
        msgDia.classList.add('lunes');
        msgDia.style.display = 'block';
      }
    }

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!esLunes) return;
      const peso = parseFloat(inputPeso.value);
      if (isNaN(peso) || peso < 30 || peso > 300) return;

      const fecha = Storage.today();
      Storage.guardarPeso(fecha, peso);

      this.renderGrafica();
      this.renderTabla();
      this.renderProgreso();

      inputPeso.value = '';
      // Show success
      const msg = document.createElement('div');
      msg.className = 'toast success';
      msg.textContent = `Peso registrado: ${peso} kg`;
      document.body.appendChild(msg);
      setTimeout(() => msg.remove(), 3000);
    });
  }
};
