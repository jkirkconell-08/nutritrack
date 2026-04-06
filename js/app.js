/* =========================================================
   NutriTrack - Lógica Principal (Checklist Diario)
   ========================================================= */

const CHECKLIST_ITEMS = [
  { id: 'agua_manana',       label: 'Agua al levantarse',           hora: '05:30', gymOnly: false, icon: '💧', seccion: 'manana' },
  { id: 'pre_entreno',       label: 'Pre-entreno (banano/galletas)', hora: '05:30', gymOnly: true,  icon: '🍌', seccion: 'manana' },
  { id: 'gym',               label: 'Gym completado',               hora: '05:30', gymOnly: true,  icon: '🏋️', seccion: 'manana' },
  { id: 'desayuno_postgym',  label: 'Desayuno post-gym',            hora: '07:00', gymOnly: false, icon: '🍳', seccion: 'manana' },
  { id: 'merienda_manana',   label: 'Merienda mañana',              hora: '09:30', gymOnly: false, icon: '🥤', seccion: 'manana' },
  { id: 'almuerzo',          label: 'Almuerzo',                     hora: '11:30', gymOnly: false, icon: '🍽️', seccion: 'tarde' },
  { id: 'merienda_tarde',    label: 'Merienda tarde',               hora: '14:30', gymOnly: false, icon: '🍎', seccion: 'tarde' },
  { id: 'cena',              label: 'Cena',                         hora: '18:00', gymOnly: false, icon: '🥗', seccion: 'noche' },
  { id: 'agua_2L',           label: '2 litros de agua en el día',   hora: '00:00', gymOnly: false, icon: '💧', seccion: 'general' },
  { id: 'dormir_10pm',       label: 'Dormir antes de 10:00pm',      hora: '21:00', gymOnly: false, icon: '🌙', seccion: 'noche' }
];

const DIAS_SEMANA = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const DIAS_CORTO = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

const App = {
  fecha: null,
  config: null,
  overlayActive: false,
  overlayInterval: null,

  init() {
    this.fecha = Storage.today();
    this.config = Storage.obtenerConfig();
    this._initDarkMode();
    this._renderFecha();
    this._renderStats();
    this._renderChecklist();
    this._renderNota();
    this._startOverlayCheck();
    Notificaciones.init();
  },

  /* ---------- Dark Mode ---------- */
  _initDarkMode() {
    const dark = Storage.getDarkMode();
    if (dark) document.body.classList.add('dark');
    else document.body.classList.remove('dark');

    const toggle = document.getElementById('dark-toggle');
    if (toggle) {
      toggle.addEventListener('click', () => {
        document.body.classList.toggle('dark');
        Storage.setDarkMode(document.body.classList.contains('dark'));
      });
    }
  },

  /* ---------- Fecha ---------- */
  _renderFecha() {
    const el = document.getElementById('fecha-display');
    if (!el) return;

    const d = new Date();
    const racha = Storage.calcularRacha();

    el.innerHTML = `
      <div class="fecha-dia">
        <span class="num">${d.getDate()}</span>
        <span class="dia">${DIAS_CORTO[d.getDay()]}</span>
      </div>
      <div class="fecha-info">
        <div class="mes-year">${MESES[d.getMonth()]} ${d.getFullYear()}</div>
        ${racha > 0 ? `<div class="racha">🔥 ${racha} día${racha > 1 ? 's' : ''} de racha</div>` : ''}
      </div>
    `;
  },

  /* ---------- Stats ---------- */
  _renderStats() {
    const el = document.getElementById('stats-row');
    if (!el) return;

    const dia = Storage.obtenerDia(this.fecha);
    const cumplimiento = dia ? dia.cumplimiento : 0;
    const racha = Storage.calcularRacha();
    const items = this._getItemsHoy();
    const checked = dia ? Object.values(dia.checklist || {}).filter(v => v === true).length : 0;

    el.innerHTML = `
      <div class="stat-mini">
        <span class="valor">${cumplimiento}%</span>
        <span class="label">Hoy</span>
      </div>
      <div class="stat-mini">
        <span class="valor">${checked}/${items.length}</span>
        <span class="label">Items</span>
      </div>
      <div class="stat-mini">
        <span class="valor">${racha}</span>
        <span class="label">Racha</span>
      </div>
    `;
  },

  /* ---------- Items disponibles hoy ---------- */
  _getItemsHoy() {
    const d = new Date();
    const diaSemana = d.getDay();
    const diasGym = this.config.diasGym || [1, 2, 3, 4, 5];
    const esGym = diasGym.includes(diaSemana);

    return CHECKLIST_ITEMS.filter(item => {
      if (item.gymOnly && !esGym) return false;
      return true;
    });
  },

  _isItemDisponible(item) {
    if (item.hora === '00:00') return true; // all day
    const now = new Date();
    const [h, m] = item.hora.split(':').map(Number);
    const horaItem = h * 60 + m;
    const horaActual = now.getHours() * 60 + now.getMinutes();
    return horaActual >= horaItem;
  },

  /* ---------- Checklist ---------- */
  _renderChecklist() {
    const container = document.getElementById('checklist-container');
    if (!container) return;

    const items = this._getItemsHoy();
    const dia = Storage.obtenerDia(this.fecha);
    const checklist = dia ? dia.checklist : {};

    // Group by section
    const secciones = {
      manana: { titulo: 'Mañana', items: [] },
      tarde: { titulo: 'Tarde', items: [] },
      noche: { titulo: 'Noche', items: [] },
      general: { titulo: 'General', items: [] }
    };

    items.forEach(item => {
      const s = secciones[item.seccion] || secciones.general;
      s.items.push(item);
    });

    container.innerHTML = '';

    for (const [key, seccion] of Object.entries(secciones)) {
      if (seccion.items.length === 0) continue;

      const section = document.createElement('div');
      section.className = 'checklist-section fade-in';

      const title = document.createElement('div');
      title.className = 'checklist-section-title';
      title.textContent = seccion.titulo;
      section.appendChild(title);

      const card = document.createElement('div');
      card.className = 'checklist-card';

      seccion.items.forEach(item => {
        const isChecked = checklist[item.id] === true;
        const disponible = this._isItemDisponible(item);

        const el = document.createElement('div');
        el.className = `check-item${isChecked ? ' checked' : ''}${!disponible ? ' disabled' : ''}`;
        el.dataset.id = item.id;

        el.innerHTML = `
          <div class="check-box">
            <svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <div class="check-icon">${item.icon}</div>
          <div class="check-content">
            <div class="check-label">${item.label}</div>
            ${!disponible ? `<div class="check-time pending">Disponible a las ${item.hora}</div>` : ''}
          </div>
        `;

        if (disponible) {
          el.addEventListener('click', () => this._toggleItem(item.id, el));
        }

        card.appendChild(el);
      });

      section.appendChild(card);
      container.appendChild(section);
    }
  },

  _toggleItem(id, el) {
    const dia = Storage.obtenerDia(this.fecha) || {
      fecha: this.fecha,
      checklist: {},
      nota: '',
      cumplimiento: 0
    };

    dia.checklist[id] = !dia.checklist[id];

    // Recalculate compliance
    const items = this._getItemsHoy();
    const total = items.length;
    const checked = items.filter(i => dia.checklist[i.id] === true).length;
    dia.cumplimiento = Math.round((checked / total) * 100);

    Storage.guardarDia(this.fecha, dia);

    // Update UI
    el.classList.toggle('checked');
    const box = el.querySelector('.check-box');
    if (box) box.classList.add('pulse');
    setTimeout(() => box && box.classList.remove('pulse'), 400);

    this._renderStats();
  },

  /* ---------- Nota ---------- */
  _renderNota() {
    const container = document.getElementById('nota-container');
    if (!container) return;

    const dia = Storage.obtenerDia(this.fecha);
    const nota = dia ? dia.nota || '' : '';

    container.innerHTML = `
      <div class="nota-card">
        <h3>📝 Nota del día</h3>
        <textarea id="nota-textarea" class="nota-textarea" placeholder="¿Qué comiste hoy? ¿Cómo te sentiste? Escribe algo...">${nota}</textarea>
        <div id="nota-guardada" class="nota-guardada">Guardada</div>
      </div>
    `;

    let timeout;
    const textarea = document.getElementById('nota-textarea');
    textarea.addEventListener('input', () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        this._guardarNota(textarea.value);
      }, 500);
    });
  },

  _guardarNota(texto) {
    const dia = Storage.obtenerDia(this.fecha) || {
      fecha: this.fecha,
      checklist: {},
      nota: '',
      cumplimiento: 0
    };

    dia.nota = texto;
    Storage.guardarDia(this.fecha, dia);

    const el = document.getElementById('nota-guardada');
    if (el) {
      el.classList.add('visible');
      setTimeout(() => el.classList.remove('visible'), 2000);
    }
  },

  /* ---------- Overlay (Nota obligatoria 9PM) ---------- */
  _startOverlayCheck() {
    // Check every 30 seconds
    this.overlayInterval = setInterval(() => this._checkOverlay(), 30000);
    this._checkOverlay();
  },

  _checkOverlay() {
    const now = new Date();
    const hora = now.getHours();
    const minutos = now.getMinutes();

    // 9:00 PM = hour 21
    if (hora < 21) return;

    const dia = Storage.obtenerDia(this.fecha);
    const nota = dia ? dia.nota || '' : '';

    if (nota.trim().length > 0) return; // already has a note

    this._showOverlay();
  },

  _showOverlay() {
    if (this.overlayActive) return;
    this.overlayActive = true;

    const overlay = document.getElementById('nota-overlay');
    if (!overlay) return;
    overlay.classList.add('active');

    const textarea = document.getElementById('overlay-nota');
    const btn = document.getElementById('overlay-guardar');

    if (btn) {
      btn.onclick = () => {
        const texto = textarea.value.trim();
        if (texto.length === 0) {
          textarea.style.borderColor = 'var(--danger)';
          textarea.placeholder = 'Debes escribir al menos una línea...';
          return;
        }
        this._guardarNota(texto);
        overlay.classList.remove('active');
        this.overlayActive = false;

        // Also update the nota textarea if visible
        const mainNota = document.getElementById('nota-textarea');
        if (mainNota) mainNota.value = texto;
      };
    }

    // Prevent closing with ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.overlayActive) {
        e.preventDefault();
        e.stopPropagation();
      }
    });
  }
};

/* ---------- Historial Page ---------- */
const Historial = {
  init() {
    this._initDarkMode();
    this._render();
  },

  _initDarkMode() {
    const dark = Storage.getDarkMode();
    if (dark) document.body.classList.add('dark');
    const toggle = document.getElementById('dark-toggle');
    if (toggle) {
      toggle.addEventListener('click', () => {
        document.body.classList.toggle('dark');
        Storage.setDarkMode(document.body.classList.contains('dark'));
      });
    }
  },

  _render() {
    const container = document.getElementById('historial-container');
    if (!container) return;

    const dias = Storage.obtenerHistorial(30);
    const config = Storage.obtenerConfig();

    if (dias.every(d => !d.data)) {
      container.innerHTML = `
        <div class="empty-state fade-in">
          <svg viewBox="0 0 24 24" stroke-width="1.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          <p>Aún no hay registros.<br>Completa tu primer checklist para empezar.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = '';
    const ITEM_LABELS = {};
    CHECKLIST_ITEMS.forEach(i => ITEM_LABELS[i.id] = i.label);

    dias.forEach((entry, idx) => {
      if (!entry.data) {
        // Day without data - show as gray
        const d = new Date(entry.fecha + 'T12:00:00');
        const el = document.createElement('div');
        el.className = 'historial-dia fade-in';
        el.innerHTML = `
          <div class="historial-header">
            <div class="historial-color gris"></div>
            <div class="historial-info">
              <div class="historial-fecha">${DIAS_SEMANA[d.getDay()]} ${d.getDate()} ${MESES[d.getMonth()]}</div>
              <div class="historial-pct">Sin registro</div>
            </div>
          </div>
        `;
        container.appendChild(el);
        return;
      }

      const d = new Date(entry.fecha + 'T12:00:00');
      const pct = entry.data.cumplimiento || 0;
      let colorClass = 'gris';
      if (pct >= 80) colorClass = 'verde';
      else if (pct >= 50) colorClass = 'amarillo';
      else if (pct > 0) colorClass = 'rojo';

      const el = document.createElement('div');
      el.className = 'historial-dia fade-in';

      let detalleHTML = '';
      if (entry.data.checklist) {
        for (const [key, val] of Object.entries(entry.data.checklist)) {
          const label = ITEM_LABELS[key] || key;
          detalleHTML += `
            <div class="detalle-item">
              <div class="detalle-check ${val ? 'si' : 'no'}">${val ? '✓' : '✗'}</div>
              <span>${label}</span>
            </div>
          `;
        }
      }

      if (entry.data.nota) {
        detalleHTML += `<div class="detalle-nota"><strong>Nota:</strong> ${entry.data.nota}</div>`;
      }

      el.innerHTML = `
        <div class="historial-header">
          <div class="historial-color ${colorClass}"></div>
          <div class="historial-info">
            <div class="historial-fecha">${DIAS_SEMANA[d.getDay()]} ${d.getDate()} ${MESES[d.getMonth()]}</div>
            <div class="historial-pct">${pct}% completado</div>
          </div>
          <div class="historial-arrow">▼</div>
        </div>
        <div class="historial-detalle">${detalleHTML}</div>
      `;

      el.querySelector('.historial-header').addEventListener('click', () => {
        el.classList.toggle('open');
      });

      container.appendChild(el);
    });
  }
};

/* ---------- Config Page ---------- */
const Config = {
  init() {
    this._initDarkMode();
    this._render();
  },

  _initDarkMode() {
    const dark = Storage.getDarkMode();
    if (dark) document.body.classList.add('dark');
    const toggle = document.getElementById('dark-toggle');
    if (toggle) {
      toggle.addEventListener('click', () => {
        document.body.classList.toggle('dark');
        Storage.setDarkMode(document.body.classList.contains('dark'));
      });
    }
  },

  _render() {
    const container = document.getElementById('config-container');
    if (!container) return;

    const config = Storage.obtenerConfig();
    const DIAS_LABELS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

    let diasHTML = '';
    for (let i = 0; i < 7; i++) {
      const checked = config.diasGym.includes(i) ? 'checked' : '';
      diasHTML += `<input type="checkbox" class="dia-checkbox" id="dia-${i}" value="${i}" ${checked}><label for="dia-${i}" class="dia-label">${DIAS_LABELS[i]}</label>`;
    }

    container.innerHTML = `
      <div class="config-section fade-in">
        <div class="config-card">
          <h3>👤 Datos personales</h3>
          <div class="config-row">
            <label for="cfg-nombre">Nombre</label>
            <input type="text" id="cfg-nombre" value="${config.nombre}">
          </div>
          <div class="config-row">
            <label for="cfg-peso-inicial">Peso inicial (kg)</label>
            <input type="number" id="cfg-peso-inicial" value="${config.pesoInicial}" step="0.1">
          </div>
          <div class="config-row">
            <label for="cfg-meta">Meta de peso (kg)</label>
            <input type="number" id="cfg-meta" value="${config.meta}" step="0.1">
          </div>
          <div class="config-row">
            <label for="cfg-hito">Hito motivador (kg)</label>
            <input type="number" id="cfg-hito" value="${config.hito}" step="0.1">
          </div>
        </div>
      </div>

      <div class="config-section fade-in">
        <div class="config-card">
          <h3>🏋️ Horarios</h3>
          <div class="config-row">
            <label for="cfg-hora-gym">Hora de inicio del gym</label>
            <input type="time" id="cfg-hora-gym" value="${config.horaGym}">
          </div>
          <div class="config-row">
            <label for="cfg-hora-cena">Hora de cena</label>
            <input type="time" id="cfg-hora-cena" value="${config.horaCena}">
          </div>
          <div class="config-row">
            <label>Días de gym</label>
            <div class="dias-gym-grid">${diasHTML}</div>
          </div>
        </div>
      </div>

      <div class="config-section fade-in">
        <button id="btn-guardar-config" class="btn btn-primary btn-full">Guardar configuración</button>
      </div>

      <div class="config-section fade-in">
        <div class="config-card">
          <h3>💾 Datos</h3>
          <p style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:12px;">Exporta tus datos como respaldo o importa un respaldo anterior.</p>
          <div class="backup-actions">
            <button id="btn-exportar" class="btn btn-secondary" style="flex:1;">Exportar</button>
            <button id="btn-importar" class="btn btn-secondary" style="flex:1;">Importar</button>
          </div>
          <input type="file" id="import-file" accept=".json" style="display:none;">
        </div>
      </div>
    `;

    // Save config
    document.getElementById('btn-guardar-config').addEventListener('click', () => {
      const diasGym = [];
      for (let i = 0; i < 7; i++) {
        if (document.getElementById(`dia-${i}`).checked) diasGym.push(i);
      }

      const newConfig = {
        nombre: document.getElementById('cfg-nombre').value,
        pesoInicial: parseFloat(document.getElementById('cfg-peso-inicial').value),
        meta: parseFloat(document.getElementById('cfg-meta').value),
        hito: parseFloat(document.getElementById('cfg-hito').value),
        horaGym: document.getElementById('cfg-hora-gym').value,
        horaCena: document.getElementById('cfg-hora-cena').value,
        diasGym
      };

      Storage.guardarConfig(newConfig);

      const toast = document.createElement('div');
      toast.className = 'toast success';
      toast.textContent = 'Configuración guardada';
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 3000);
    });

    // Export
    document.getElementById('btn-exportar').addEventListener('click', () => {
      const data = Storage.exportarDatos();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nutritrack_backup_${Storage.today()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });

    // Import
    document.getElementById('btn-importar').addEventListener('click', () => {
      document.getElementById('import-file').click();
    });

    document.getElementById('import-file').addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          Storage.importarDatos(ev.target.result);
          const toast = document.createElement('div');
          toast.className = 'toast success';
          toast.textContent = 'Datos importados correctamente. Recargando...';
          document.body.appendChild(toast);
          setTimeout(() => location.reload(), 2000);
        } catch (err) {
          const toast = document.createElement('div');
          toast.className = 'toast warning';
          toast.textContent = 'Error al importar: archivo inválido';
          document.body.appendChild(toast);
          setTimeout(() => toast.remove(), 3000);
        }
      };
      reader.readAsText(file);
    });
  }
};

/* ---------- Progreso Page Init ---------- */
const Progreso = {
  init() {
    this._initDarkMode();
    Charts.init();
  },

  _initDarkMode() {
    const dark = Storage.getDarkMode();
    if (dark) document.body.classList.add('dark');
    const toggle = document.getElementById('dark-toggle');
    if (toggle) {
      toggle.addEventListener('click', () => {
        document.body.classList.toggle('dark');
        Storage.setDarkMode(document.body.classList.contains('dark'));
        Charts.renderGrafica();
      });
    }
  }
};
