/* =========================================================
   NutriTrack - Registro de Ejercicios
   ========================================================= */

const EXERCISE_DB = [
  // Pecho
  { id: 1,  name: 'Press de banca',         grupo: 'pecho', icon: '🏋️' },
  { id: 2,  name: 'Press inclinado',        grupo: 'pecho', icon: '🏋️' },
  { id: 3,  name: 'Press declinado',        grupo: 'pecho', icon: '🏋️' },
  { id: 4,  name: 'Aperturas mancuernas',   grupo: 'pecho', icon: '🏋️' },
  { id: 5,  name: 'Cruces en polea',        grupo: 'pecho', icon: '🏋️' },
  { id: 6,  name: 'Fondos en paralelas',    grupo: 'pecho', icon: '🏋️' },
  { id: 7,  name: 'Push-ups / Lagartijas',  grupo: 'pecho', icon: '🏋️' },
  // Espalda
  { id: 10, name: 'Jalón al pecho',         grupo: 'espalda', icon: '💪' },
  { id: 11, name: 'Remo con barra',         grupo: 'espalda', icon: '💪' },
  { id: 12, name: 'Remo con mancuerna',     grupo: 'espalda', icon: '💪' },
  { id: 13, name: 'Peso muerto',            grupo: 'espalda', icon: '💪' },
  { id: 14, name: 'Dominadas / Pull-ups',   grupo: 'espalda', icon: '💪' },
  { id: 15, name: 'Remo en polea baja',     grupo: 'espalda', icon: '💪' },
  { id: 16, name: 'Pullover',               grupo: 'espalda', icon: '💪' },
  // Hombros
  { id: 20, name: 'Press militar',          grupo: 'hombros', icon: '🎯' },
  { id: 21, name: 'Elevaciones laterales',  grupo: 'hombros', icon: '🎯' },
  { id: 22, name: 'Elevaciones frontales',  grupo: 'hombros', icon: '🎯' },
  { id: 23, name: 'Pájaros / Rear delt',    grupo: 'hombros', icon: '🎯' },
  { id: 24, name: 'Press Arnold',           grupo: 'hombros', icon: '🎯' },
  { id: 25, name: 'Encogimientos (traps)',   grupo: 'hombros', icon: '🎯' },
  // Brazos
  { id: 30, name: 'Curl de bíceps barra',   grupo: 'brazos', icon: '💪' },
  { id: 31, name: 'Curl de bíceps mancuerna', grupo: 'brazos', icon: '💪' },
  { id: 32, name: 'Curl martillo',          grupo: 'brazos', icon: '💪' },
  { id: 33, name: 'Tríceps en polea',       grupo: 'brazos', icon: '💪' },
  { id: 34, name: 'Extensión tríceps',      grupo: 'brazos', icon: '💪' },
  { id: 35, name: 'Fondos para tríceps',    grupo: 'brazos', icon: '💪' },
  { id: 36, name: 'Press francés',          grupo: 'brazos', icon: '💪' },
  // Pierna
  { id: 40, name: 'Sentadilla (squat)',     grupo: 'pierna', icon: '🦵' },
  { id: 41, name: 'Prensa de pierna',       grupo: 'pierna', icon: '🦵' },
  { id: 42, name: 'Extensión de pierna',    grupo: 'pierna', icon: '🦵' },
  { id: 43, name: 'Curl femoral',           grupo: 'pierna', icon: '🦵' },
  { id: 44, name: 'Zancadas / Lunges',      grupo: 'pierna', icon: '🦵' },
  { id: 45, name: 'Elevación de pantorrilla', grupo: 'pierna', icon: '🦵' },
  { id: 46, name: 'Hip thrust',             grupo: 'pierna', icon: '🦵' },
  { id: 47, name: 'Peso muerto rumano',     grupo: 'pierna', icon: '🦵' },
  // Core
  { id: 50, name: 'Abdominales / Crunch',   grupo: 'core', icon: '🔥' },
  { id: 51, name: 'Plancha',                grupo: 'core', icon: '🔥' },
  { id: 52, name: 'Russian twist',          grupo: 'core', icon: '🔥' },
  { id: 53, name: 'Elevación de piernas',   grupo: 'core', icon: '🔥' },
  { id: 54, name: 'Mountain climbers',      grupo: 'core', icon: '🔥' },
  // Cardio
  { id: 60, name: 'Caminadora',             grupo: 'cardio', icon: '🏃' },
  { id: 61, name: 'Bicicleta estática',     grupo: 'cardio', icon: '🏃' },
  { id: 62, name: 'Elíptica',               grupo: 'cardio', icon: '🏃' },
  { id: 63, name: 'Correr',                 grupo: 'cardio', icon: '🏃' },
  { id: 64, name: 'Saltar cuerda',          grupo: 'cardio', icon: '🏃' },
];

const EXERCISE_GROUPS = [
  { id: 'pecho',    name: 'Pecho',    icon: '🏋️' },
  { id: 'espalda',  name: 'Espalda',  icon: '💪' },
  { id: 'hombros',  name: 'Hombros',  icon: '🎯' },
  { id: 'brazos',   name: 'Brazos',   icon: '💪' },
  { id: 'pierna',   name: 'Pierna',   icon: '🦵' },
  { id: 'core',     name: 'Core',     icon: '🔥' },
  { id: 'cardio',   name: 'Cardio',   icon: '🏃' },
];

const Ejercicios = {
  fecha: null,

  init() {
    initDarkMode();
    this.fecha = Storage.today();
    this._render();
  },

  _render() {
    const container = document.getElementById('ejercicios-container');
    if (!container) return;

    const registro = Storage.obtenerEjercicios(this.fecha);
    const ejercicios = registro.ejercicios || [];

    container.innerHTML = `
      <!-- Stats rápidos -->
      <div class="stats-row" style="margin-bottom:16px;">
        <div class="stat-mini"><span class="valor">${ejercicios.length}</span><span class="label">Ejercicios</span></div>
        <div class="stat-mini"><span class="valor">${ejercicios.reduce((s, e) => s + (e.series || []).length, 0)}</span><span class="label">Series</span></div>
        <div class="stat-mini"><span class="valor">${registro.duracion || 0}'</span><span class="label">Minutos</span></div>
      </div>

      <!-- Duración -->
      <div class="ex-duration-row">
        <label>Duración (min):</label>
        <input type="number" id="ex-duracion" value="${registro.duracion || 0}" min="0" step="5" class="ex-duration-input">
      </div>

      <!-- Agregar ejercicio -->
      <button id="btn-add-exercise" class="btn btn-primary btn-full" style="margin-bottom:16px;">+ Agregar ejercicio</button>

      <!-- Lista de ejercicios -->
      <div id="ex-list"></div>

      <!-- Nota -->
      <div class="nota-card" style="margin-top:16px;">
        <h3>📝 Nota del entrenamiento</h3>
        <textarea id="ex-nota" class="nota-textarea" placeholder="¿Cómo estuvo el entreno?">${registro.nota || ''}</textarea>
      </div>
    `;

    this._renderList(ejercicios);

    document.getElementById('btn-add-exercise').addEventListener('click', () => this._showExercisePicker());

    document.getElementById('ex-duracion').addEventListener('change', (e) => {
      const reg = Storage.obtenerEjercicios(this.fecha);
      reg.duracion = parseInt(e.target.value) || 0;
      Storage.guardarEjercicios(this.fecha, reg);
    });

    let noteTimeout;
    document.getElementById('ex-nota').addEventListener('input', (e) => {
      clearTimeout(noteTimeout);
      noteTimeout = setTimeout(() => {
        const reg = Storage.obtenerEjercicios(this.fecha);
        reg.nota = e.target.value;
        Storage.guardarEjercicios(this.fecha, reg);
      }, 500);
    });
  },

  _renderList(ejercicios) {
    const container = document.getElementById('ex-list');
    if (!container) return;

    if (ejercicios.length === 0) {
      container.innerHTML = '<div class="empty-state"><p>No hay ejercicios registrados hoy.<br>Toca "+ Agregar ejercicio" para empezar.</p></div>';
      return;
    }

    container.innerHTML = ejercicios.map((ex, idx) => `
      <div class="ex-card fade-in">
        <div class="ex-card-header">
          <span class="ex-card-name">${ex.icon || '🏋️'} ${ex.nombre}</span>
          <button class="meal-item-del" data-idx="${idx}" title="Eliminar">✕</button>
        </div>
        <div class="ex-series-list">
          ${(ex.series || []).map((s, si) => `
            <div class="ex-serie-row">
              <span class="ex-serie-num">${si + 1}</span>
              <input type="number" class="ex-serie-input" data-ex="${idx}" data-si="${si}" data-field="peso" value="${s.peso || 0}" placeholder="kg" step="2.5">
              <span class="ex-serie-x">kg ×</span>
              <input type="number" class="ex-serie-input" data-ex="${idx}" data-si="${si}" data-field="reps" value="${s.reps || 0}" placeholder="reps">
              <span class="ex-serie-x">reps</span>
            </div>
          `).join('')}
        </div>
        <button class="ex-add-serie-btn" data-idx="${idx}">+ Serie</button>
      </div>
    `).join('');

    // Delete exercise
    container.querySelectorAll('.meal-item-del').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.target.dataset.idx);
        const reg = Storage.obtenerEjercicios(this.fecha);
        reg.ejercicios.splice(idx, 1);
        Storage.guardarEjercicios(this.fecha, reg);
        this._render();
      });
    });

    // Add serie
    container.querySelectorAll('.ex-add-serie-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.target.dataset.idx);
        const reg = Storage.obtenerEjercicios(this.fecha);
        if (!reg.ejercicios[idx].series) reg.ejercicios[idx].series = [];
        reg.ejercicios[idx].series.push({ peso: 0, reps: 0 });
        Storage.guardarEjercicios(this.fecha, reg);
        this._render();
      });
    });

    // Update serie values
    container.querySelectorAll('.ex-serie-input').forEach(input => {
      input.addEventListener('change', (e) => {
        const exIdx = parseInt(e.target.dataset.ex);
        const siIdx = parseInt(e.target.dataset.si);
        const field = e.target.dataset.field;
        const reg = Storage.obtenerEjercicios(this.fecha);
        reg.ejercicios[exIdx].series[siIdx][field] = parseFloat(e.target.value) || 0;
        Storage.guardarEjercicios(this.fecha, reg);
      });
    });
  },

  _showExercisePicker() {
    const overlay = document.getElementById('exercise-overlay');
    if (!overlay) return;
    overlay.classList.add('active');

    let currentGroup = 'all';

    overlay.innerHTML = `
      <div class="overlay-content" style="max-width:500px;max-height:90vh;overflow-y:auto;text-align:left;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
          <h2 style="font-size:1.1rem;">💪 Elegir ejercicio</h2>
          <button id="ex-overlay-close" style="background:none;border:none;color:var(--text-muted);font-size:1.5rem;cursor:pointer;">✕</button>
        </div>
        <input type="search" id="ex-search" class="food-search-input" placeholder="Buscar ejercicio..." autocomplete="off">
        <div id="ex-groups" class="food-cat-btns"></div>
        <div id="ex-results" class="food-search-results"></div>
        <div style="border-top:1px solid var(--border);padding-top:12px;margin-top:12px;">
          <h4 style="font-size:0.85rem;margin-bottom:8px;">✏️ Ejercicio personalizado</h4>
          <div style="display:flex;gap:8px;">
            <input type="text" id="ex-custom-name" placeholder="Nombre del ejercicio" style="flex:1;padding:10px;border:1px solid var(--border);border-radius:var(--radius-sm);background:var(--bg-input);color:var(--text-primary);font-size:0.9rem;">
            <button id="ex-custom-add" class="btn btn-primary" style="padding:10px 16px;">+</button>
          </div>
        </div>
      </div>
    `;

    const groupsDiv = document.getElementById('ex-groups');
    const resultsDiv = document.getElementById('ex-results');

    groupsDiv.innerHTML = `<button class="cat-btn active" data-g="all">Todos</button>` +
      EXERCISE_GROUPS.map(g => `<button class="cat-btn" data-g="${g.id}">${g.icon} ${g.name}</button>`).join('');

    const renderResults = (filter = '', group = 'all') => {
      let exs = EXERCISE_DB;
      if (group !== 'all') exs = exs.filter(e => e.grupo === group);
      if (filter.trim()) {
        const q = filter.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        exs = exs.filter(e => e.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(q));
      }
      resultsDiv.innerHTML = exs.map(e => `
        <div class="food-result" data-eid="${e.id}">
          <div class="food-result-info">
            <div class="food-result-name">${e.icon} ${e.name}</div>
            <div class="food-result-detail">${EXERCISE_GROUPS.find(g => g.id === e.grupo)?.name || e.grupo}</div>
          </div>
          <button class="food-result-add">+</button>
        </div>
      `).join('');

      resultsDiv.querySelectorAll('.food-result-add').forEach(btn => {
        btn.addEventListener('click', (ev) => {
          const eid = parseInt(ev.target.closest('.food-result').dataset.eid);
          const ex = EXERCISE_DB.find(e => e.id === eid);
          if (ex) this._addExercise(ex.name, ex.icon);
          overlay.classList.remove('active');
        });
      });
    };

    renderResults();

    document.getElementById('ex-search').addEventListener('input', (e) => renderResults(e.target.value, currentGroup));

    groupsDiv.querySelectorAll('.cat-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        groupsDiv.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentGroup = btn.dataset.g;
        renderResults(document.getElementById('ex-search').value, currentGroup);
      });
    });

    document.getElementById('ex-overlay-close').addEventListener('click', () => overlay.classList.remove('active'));

    document.getElementById('ex-custom-add').addEventListener('click', () => {
      const name = document.getElementById('ex-custom-name').value.trim();
      if (name) { this._addExercise(name, '🏋️'); overlay.classList.remove('active'); }
    });
  },

  _addExercise(nombre, icon) {
    const reg = Storage.obtenerEjercicios(this.fecha);
    if (!reg.ejercicios) reg.ejercicios = [];
    reg.ejercicios.push({ nombre, icon, series: [{ peso: 0, reps: 0 }] });
    Storage.guardarEjercicios(this.fecha, reg);
    this._render();
    showToast(`${nombre} agregado`);
  }
};
