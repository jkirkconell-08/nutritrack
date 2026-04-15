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

/* ─── Helper: dark mode init (shared) ─── */
function initDarkMode() {
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
}

/* ─── Helper: get items for a specific date ─── */
function getItemsForDate(fecha) {
  const d = new Date(fecha + 'T12:00:00');
  const diaSemana = d.getDay();
  const config = Storage.obtenerConfig();
  const diasGym = config.diasGym || [1, 2, 3, 4, 5];
  const esGym = diasGym.includes(diaSemana);
  return CHECKLIST_ITEMS.filter(item => {
    if (item.gymOnly && !esGym) return false;
    return true;
  });
}

/* ─── Helper: toast ─── */
function showToast(msg, type = 'success') {
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}

/* =========================================================
   App - Checklist del día actual
   ========================================================= */
const App = {
  fecha: null,
  config: null,
  overlayActive: false,

  init() {
    this.fecha = Storage.today();
    this.config = Storage.obtenerConfig();
    initDarkMode();
    this._renderFecha();
    this._renderStats();
    this._renderWater();
    this._renderChecklist();
    this._renderNota();
    this._startOverlayCheck();
    Notificaciones.init();
  },

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

  _renderStats() {
    const el = document.getElementById('stats-row');
    if (!el) return;
    const dia = Storage.obtenerDia(this.fecha);
    const cumplimiento = dia ? dia.cumplimiento : 0;
    const racha = Storage.calcularRacha();
    const items = getItemsForDate(this.fecha);
    const checked = dia ? Object.values(dia.checklist || {}).filter(v => v === true).length : 0;
    el.innerHTML = `
      <div class="stat-mini"><span class="valor">${cumplimiento}%</span><span class="label">Hoy</span></div>
      <div class="stat-mini"><span class="valor">${checked}/${items.length}</span><span class="label">Items</span></div>
      <div class="stat-mini"><span class="valor">${racha}</span><span class="label">Racha</span></div>
    `;
  },

  _renderWater() {
    const el = document.getElementById('water-widget');
    if (!el) return;
    const agua = Storage.obtenerAgua(this.fecha);
    const pct = Math.min(100, (agua.vasos / agua.meta) * 100);
    const full = agua.vasos >= agua.meta;

    el.innerHTML = `
      <div class="water-card fade-in ${full ? 'complete' : ''}">
        <div class="water-left">
          <div class="water-bottle">
            <div class="water-fill" style="height:${pct}%"></div>
            <div class="water-drops">${'💧'.repeat(Math.min(agua.vasos, agua.meta))}</div>
          </div>
        </div>
        <div class="water-right">
          <div class="water-count">${agua.vasos}<span>/${agua.meta}</span></div>
          <div class="water-label">vasos de agua</div>
          <div class="water-btns">
            <button id="water-minus" class="water-btn minus">−</button>
            <button id="water-plus" class="water-btn plus">+ 1 vaso</button>
          </div>
          ${full ? '<div class="water-done">✅ ¡Meta cumplida!</div>' : ''}
        </div>
      </div>
    `;

    document.getElementById('water-plus').addEventListener('click', () => {
      Storage.agregarVasoAgua(this.fecha);
      this._renderWater();
    });
    document.getElementById('water-minus').addEventListener('click', () => {
      Storage.quitarVasoAgua(this.fecha);
      this._renderWater();
    });
  },

  _isItemDisponible(item) {
    if (item.hora === '00:00') return true;
    const now = new Date();
    const [h, m] = item.hora.split(':').map(Number);
    return now.getHours() * 60 + now.getMinutes() >= h * 60 + m;
  },

  _renderChecklist() {
    const container = document.getElementById('checklist-container');
    if (!container) return;
    const items = getItemsForDate(this.fecha);
    const dia = Storage.obtenerDia(this.fecha);
    const checklist = dia ? dia.checklist : {};

    const secciones = {
      manana: { titulo: 'Mañana', items: [] }, tarde: { titulo: 'Tarde', items: [] },
      noche: { titulo: 'Noche', items: [] }, general: { titulo: 'General', items: [] }
    };
    items.forEach(item => (secciones[item.seccion] || secciones.general).items.push(item));

    container.innerHTML = '';
    for (const [, seccion] of Object.entries(secciones)) {
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
        el.innerHTML = `
          <div class="check-box"><svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg></div>
          <div class="check-icon">${item.icon}</div>
          <div class="check-content">
            <div class="check-label">${item.label}</div>
            ${!disponible ? `<div class="check-time pending">Disponible a las ${item.hora}</div>` : ''}
          </div>
        `;
        if (disponible) el.addEventListener('click', () => this._toggleItem(item.id, el));
        card.appendChild(el);
      });
      section.appendChild(card);
      container.appendChild(section);
    }
  },

  _toggleItem(id, el) {
    const dia = Storage.obtenerDia(this.fecha) || { fecha: this.fecha, checklist: {}, nota: '', cumplimiento: 0 };
    dia.checklist[id] = !dia.checklist[id];
    const items = getItemsForDate(this.fecha);
    const checked = items.filter(i => dia.checklist[i.id] === true).length;
    dia.cumplimiento = Math.round((checked / items.length) * 100);
    Storage.guardarDia(this.fecha, dia);
    el.classList.toggle('checked');
    const box = el.querySelector('.check-box');
    if (box) { box.classList.add('pulse'); setTimeout(() => box.classList.remove('pulse'), 400); }
    this._renderStats();
  },

  _renderNota() {
    const container = document.getElementById('nota-container');
    if (!container) return;
    const dia = Storage.obtenerDia(this.fecha);
    const nota = dia ? dia.nota || '' : '';
    container.innerHTML = `
      <div class="nota-card">
        <h3>📝 Nota del día</h3>
        <textarea id="nota-textarea" class="nota-textarea" placeholder="¿Qué comiste hoy? ¿Cómo te sentiste?">${nota}</textarea>
        <div id="nota-guardada" class="nota-guardada">Guardada</div>
      </div>
    `;
    let timeout;
    document.getElementById('nota-textarea').addEventListener('input', (e) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => this._guardarNota(e.target.value), 500);
    });
  },

  _guardarNota(texto) {
    const dia = Storage.obtenerDia(this.fecha) || { fecha: this.fecha, checklist: {}, nota: '', cumplimiento: 0 };
    dia.nota = texto;
    Storage.guardarDia(this.fecha, dia);
    const el = document.getElementById('nota-guardada');
    if (el) { el.classList.add('visible'); setTimeout(() => el.classList.remove('visible'), 2000); }
  },

  _startOverlayCheck() {
    setInterval(() => this._checkOverlay(), 30000);
    this._checkOverlay();
  },

  _checkOverlay() {
    const now = new Date();
    if (now.getHours() < 21) return;
    const dia = Storage.obtenerDia(this.fecha);
    if (dia && (dia.nota || '').trim().length > 0) return;
    this._showOverlay();
  },

  _showOverlay() {
    if (this.overlayActive) return;
    this.overlayActive = true;
    const overlay = document.getElementById('nota-overlay');
    if (!overlay) return;
    overlay.classList.add('active');
    const btn = document.getElementById('overlay-guardar');
    if (btn) {
      btn.onclick = () => {
        const texto = document.getElementById('overlay-nota').value.trim();
        if (!texto) { document.getElementById('overlay-nota').style.borderColor = 'var(--danger)'; return; }
        this._guardarNota(texto);
        overlay.classList.remove('active');
        this.overlayActive = false;
        const mainNota = document.getElementById('nota-textarea');
        if (mainNota) mainNota.value = texto;
      };
    }
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && this.overlayActive) { e.preventDefault(); e.stopPropagation(); } });
  }
};

/* =========================================================
   Historial - Con edición de días anteriores
   ========================================================= */
const Historial = {
  init() {
    initDarkMode();
    this._render();
  },

  _render() {
    const container = document.getElementById('historial-container');
    if (!container) return;
    const dias = Storage.obtenerHistorial(30);
    const ITEM_LABELS = {};
    CHECKLIST_ITEMS.forEach(i => ITEM_LABELS[i.id] = i.label);

    if (dias.every(d => !d.data)) {
      container.innerHTML = `<div class="empty-state fade-in"><p>Aún no hay registros.<br>Completa tu primer checklist.</p></div>`;
      return;
    }

    container.innerHTML = '';
    dias.forEach((entry) => {
      const d = new Date(entry.fecha + 'T12:00:00');
      const esHoy = entry.fecha === Storage.today();

      if (!entry.data) {
        const el = document.createElement('div');
        el.className = 'historial-dia fade-in';
        el.innerHTML = `
          <div class="historial-header">
            <div class="historial-color gris"></div>
            <div class="historial-info">
              <div class="historial-fecha">${DIAS_SEMANA[d.getDay()]} ${d.getDate()} ${MESES[d.getMonth()]}</div>
              <div class="historial-pct">Sin registro</div>
            </div>
            ${!esHoy ? '<button class="hist-edit-btn">Editar</button>' : ''}
          </div>
        `;
        if (!esHoy) {
          el.querySelector('.hist-edit-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            this._openEditOverlay(entry.fecha);
          });
        }
        container.appendChild(el);
        return;
      }

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
          detalleHTML += `<div class="detalle-item"><div class="detalle-check ${val ? 'si' : 'no'}">${val ? '✓' : '✗'}</div><span>${ITEM_LABELS[key] || key}</span></div>`;
        }
      }
      if (entry.data.nota) detalleHTML += `<div class="detalle-nota"><strong>Nota:</strong> ${entry.data.nota}</div>`;

      el.innerHTML = `
        <div class="historial-header">
          <div class="historial-color ${colorClass}"></div>
          <div class="historial-info">
            <div class="historial-fecha">${DIAS_SEMANA[d.getDay()]} ${d.getDate()} ${MESES[d.getMonth()]}</div>
            <div class="historial-pct">${pct}% completado</div>
          </div>
          ${!esHoy ? '<button class="hist-edit-btn">Editar</button>' : ''}
          <div class="historial-arrow">▼</div>
        </div>
        <div class="historial-detalle">${detalleHTML}</div>
      `;

      el.querySelector('.historial-header').addEventListener('click', (e) => {
        if (e.target.classList.contains('hist-edit-btn')) return;
        el.classList.toggle('open');
      });

      if (!esHoy) {
        el.querySelector('.hist-edit-btn').addEventListener('click', (e) => {
          e.stopPropagation();
          this._openEditOverlay(entry.fecha);
        });
      }

      container.appendChild(el);
    });
  },

  /* ─── Edit overlay for past days ─── */
  _openEditOverlay(fecha) {
    const overlay = document.getElementById('edit-overlay');
    if (!overlay) return;
    overlay.classList.add('active');

    const d = new Date(fecha + 'T12:00:00');
    const items = getItemsForDate(fecha);
    const dia = Storage.obtenerDia(fecha) || { fecha, checklist: {}, nota: '', cumplimiento: 0 };

    let checklistHTML = '';
    items.forEach(item => {
      const isChecked = dia.checklist[item.id] === true;
      checklistHTML += `
        <div class="check-item${isChecked ? ' checked' : ''}" data-id="${item.id}">
          <div class="check-box"><svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg></div>
          <div class="check-icon">${item.icon}</div>
          <div class="check-content"><div class="check-label">${item.label}</div></div>
        </div>
      `;
    });

    overlay.innerHTML = `
      <div class="overlay-content" style="max-width:500px;max-height:90vh;overflow-y:auto;text-align:left;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
          <h2 style="font-size:1.1rem;">📝 ${DIAS_SEMANA[d.getDay()]} ${d.getDate()} ${MESES[d.getMonth()]}</h2>
          <button id="edit-close" style="background:none;border:none;color:var(--text-muted);font-size:1.5rem;cursor:pointer;">✕</button>
        </div>
        <div class="checklist-card" id="edit-checklist">${checklistHTML}</div>
        <div style="margin-top:16px;">
          <label style="font-size:0.85rem;font-weight:600;color:var(--text-secondary);display:block;margin-bottom:6px;">Nota del día</label>
          <textarea id="edit-nota" class="nota-textarea" placeholder="¿Cómo fue tu día?">${dia.nota || ''}</textarea>
        </div>
        <button id="edit-save" class="btn btn-primary btn-full" style="margin-top:16px;">Guardar cambios</button>
      </div>
    `;

    // Toggle items
    overlay.querySelectorAll('.check-item').forEach(el => {
      el.addEventListener('click', () => el.classList.toggle('checked'));
    });

    // Close
    document.getElementById('edit-close').addEventListener('click', () => overlay.classList.remove('active'));

    // Save
    document.getElementById('edit-save').addEventListener('click', () => {
      const checklist = {};
      overlay.querySelectorAll('.check-item').forEach(el => {
        checklist[el.dataset.id] = el.classList.contains('checked');
      });
      const nota = document.getElementById('edit-nota').value;
      const total = items.length;
      const checked = Object.values(checklist).filter(v => v).length;
      const cumplimiento = Math.round((checked / total) * 100);

      Storage.guardarDia(fecha, { fecha, checklist, nota, cumplimiento });
      overlay.classList.remove('active');
      showToast('Día actualizado');
      this._render();
    });
  }
};

/* =========================================================
   Config
   ========================================================= */
const Config = {
  init() {
    initDarkMode();
    this._render();
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
          <div class="config-row"><label for="cfg-nombre">Nombre</label><input type="text" id="cfg-nombre" value="${config.nombre}"></div>
          <div class="config-row"><label for="cfg-peso-inicial">Peso inicial (kg)</label><input type="number" id="cfg-peso-inicial" value="${config.pesoInicial}" step="0.1"></div>
          <div class="config-row"><label for="cfg-meta">Meta de peso (kg)</label><input type="number" id="cfg-meta" value="${config.meta}" step="0.1"></div>
          <div class="config-row"><label for="cfg-hito">Hito motivador (kg)</label><input type="number" id="cfg-hito" value="${config.hito}" step="0.1"></div>
          <div class="config-row"><label for="cfg-meta-cal">Meta calórica diaria (kcal)</label><input type="number" id="cfg-meta-cal" value="${config.metaCal || 2200}" step="50"></div>
        </div>
      </div>

      <div class="config-section fade-in">
        <div class="config-card">
          <h3>🏋️ Horarios</h3>
          <div class="config-row"><label for="cfg-hora-gym">Hora de inicio del gym</label><input type="time" id="cfg-hora-gym" value="${config.horaGym}"></div>
          <div class="config-row"><label for="cfg-hora-cena">Hora de cena</label><input type="time" id="cfg-hora-cena" value="${config.horaCena}"></div>
          <div class="config-row"><label>Días de gym</label><div class="dias-gym-grid">${diasHTML}</div></div>
        </div>
      </div>

      <div class="config-section fade-in">
        <button id="btn-guardar-config" class="btn btn-primary btn-full">Guardar configuración</button>
      </div>

      <div class="config-section fade-in">
        <div class="config-card">
          <h3>🔔 Notificaciones</h3>
          <p style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:12px;">Prueba que las notificaciones funcionan en tu dispositivo.</p>
          <button id="btn-test-notif" class="btn btn-secondary btn-full">Enviar notificación de prueba</button>
        </div>
      </div>

      <div class="config-section fade-in">
        <div class="config-card">
          <h3>💾 Datos</h3>
          <p style="font-size:0.85rem;color:var(--text-secondary);margin-bottom:12px;">Exporta tus datos como respaldo o importa uno anterior.</p>
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
      for (let i = 0; i < 7; i++) { if (document.getElementById(`dia-${i}`).checked) diasGym.push(i); }
      Storage.guardarConfig({
        nombre: document.getElementById('cfg-nombre').value,
        pesoInicial: parseFloat(document.getElementById('cfg-peso-inicial').value),
        meta: parseFloat(document.getElementById('cfg-meta').value),
        hito: parseFloat(document.getElementById('cfg-hito').value),
        metaCal: parseInt(document.getElementById('cfg-meta-cal').value) || 2200,
        horaGym: document.getElementById('cfg-hora-gym').value,
        horaCena: document.getElementById('cfg-hora-cena').value,
        diasGym
      });
      showToast('Configuración guardada');
    });

    // Test notification
    document.getElementById('btn-test-notif').addEventListener('click', () => Notificaciones.test());

    // Export
    document.getElementById('btn-exportar').addEventListener('click', () => {
      const blob = new Blob([Storage.exportarDatos()], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `nutritrack_backup_${Storage.today()}.json`;
      a.click();
    });

    // Import
    document.getElementById('btn-importar').addEventListener('click', () => document.getElementById('import-file').click());
    document.getElementById('import-file').addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try { Storage.importarDatos(ev.target.result); showToast('Datos importados. Recargando...'); setTimeout(() => location.reload(), 1500); }
        catch { showToast('Error al importar', 'warning'); }
      };
      reader.readAsText(file);
    });
  }
};

/* =========================================================
   Progreso
   ========================================================= */
const Progreso = {
  init() {
    initDarkMode();
    Charts.init();
  }
};
