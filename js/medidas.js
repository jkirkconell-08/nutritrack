/* =========================================================
   NutriTrack - Medidas Corporales
   ========================================================= */

const MEDIDA_FIELDS = [
  { id: 'cintura',  label: 'Cintura',       icon: '📏', unit: 'cm' },
  { id: 'pecho',    label: 'Pecho',         icon: '📏', unit: 'cm' },
  { id: 'cadera',   label: 'Cadera',        icon: '📏', unit: 'cm' },
  { id: 'brazoD',   label: 'Brazo derecho', icon: '💪', unit: 'cm' },
  { id: 'brazoI',   label: 'Brazo izquierdo', icon: '💪', unit: 'cm' },
  { id: 'piernaD',  label: 'Pierna derecha', icon: '🦵', unit: 'cm' },
  { id: 'piernaI',  label: 'Pierna izquierda', icon: '🦵', unit: 'cm' },
  { id: 'cuello',   label: 'Cuello',        icon: '📏', unit: 'cm' },
];

const Medidas = {
  init() {
    initDarkMode();
    this._render();
  },

  _render() {
    const container = document.getElementById('medidas-container');
    if (!container) return;

    const data = Storage.obtenerMedidas();
    const registros = data.registros || [];
    const ultimo = registros.length > 0 ? registros[0] : null;
    const penultimo = registros.length > 1 ? registros[1] : null;

    container.innerHTML = `
      <!-- Registrar nuevas medidas -->
      <div class="config-card fade-in" style="margin-bottom:20px;">
        <h3>📏 Registrar medidas</h3>
        <p style="font-size:0.8rem;color:var(--text-muted);margin-bottom:16px;">Medite cada 2-4 semanas para ver cambios reales.</p>
        <div class="medidas-grid">
          ${MEDIDA_FIELDS.map(f => `
            <div class="config-row" style="margin-bottom:12px;">
              <label>${f.icon} ${f.label} (${f.unit})</label>
              <input type="number" id="med-${f.id}" step="0.5" placeholder="${ultimo ? ultimo[f.id] || '' : ''}" value="">
            </div>
          `).join('')}
        </div>
        <button id="btn-guardar-medidas" class="btn btn-primary btn-full">Guardar medidas</button>
      </div>

      <!-- Última medición vs anterior -->
      ${ultimo ? `
        <div class="config-card fade-in" style="margin-bottom:20px;">
          <h3>📊 Última medición</h3>
          <p style="font-size:0.8rem;color:var(--text-muted);margin-bottom:12px;">${this._formatDate(ultimo.fecha)}</p>
          <div class="medidas-compare">
            ${MEDIDA_FIELDS.map(f => {
              const val = ultimo[f.id];
              if (!val) return '';
              const prev = penultimo ? penultimo[f.id] : null;
              let diff = '';
              if (prev) {
                const d = val - prev;
                if (d !== 0) diff = `<span class="${d < 0 ? 'positivo' : 'negativo'}">${d > 0 ? '+' : ''}${d.toFixed(1)}</span>`;
              }
              return `
                <div class="medida-compare-row">
                  <span class="medida-label">${f.icon} ${f.label}</span>
                  <span class="medida-val">${val} ${f.unit}</span>
                  ${diff}
                </div>
              `;
            }).join('')}
          </div>
        </div>
      ` : ''}

      <!-- Historial -->
      ${registros.length > 0 ? `
        <div class="config-card fade-in">
          <h3>📅 Historial de medidas</h3>
          <div class="tabla-card" style="border:none;box-shadow:none;">
            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  ${MEDIDA_FIELDS.slice(0, 4).map(f => `<th>${f.label.substring(0, 4)}</th>`).join('')}
                </tr>
              </thead>
              <tbody>
                ${registros.slice(0, 10).map(r => `
                  <tr>
                    <td>${this._formatDateShort(r.fecha)}</td>
                    ${MEDIDA_FIELDS.slice(0, 4).map(f => `<td>${r[f.id] || '-'}</td>`).join('')}
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      ` : ''}
    `;

    document.getElementById('btn-guardar-medidas').addEventListener('click', () => {
      const medida = { fecha: Storage.today() };
      let hasData = false;
      MEDIDA_FIELDS.forEach(f => {
        const val = parseFloat(document.getElementById(`med-${f.id}`).value);
        if (val > 0) { medida[f.id] = val; hasData = true; }
      });
      if (!hasData) { showToast('Ingresa al menos una medida', 'warning'); return; }
      Storage.agregarMedida(medida);
      showToast('Medidas guardadas');
      this._render();
    });
  },

  _formatDate(fecha) {
    const d = new Date(fecha + 'T12:00:00');
    const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    return `${d.getDate()} ${MESES[d.getMonth()]} ${d.getFullYear()}`;
  },

  _formatDateShort(fecha) {
    const d = new Date(fecha + 'T12:00:00');
    return `${d.getDate()}/${d.getMonth() + 1}`;
  }
};
