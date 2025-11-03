// ========= GESTOR DE UI (Filtros, Drawer, Progress) =========
import { PHASES } from './config.js';

export class UIManager {
  constructor(mapManager, onPhaseChange, onMapChange) {
    this.mapManager = mapManager;
    this.onPhaseChange = onPhaseChange;
    this.onMapChange = onMapChange;
    
    // Referencias DOM
    this.phaseFilter = document.getElementById('phase-filter');
    this.mapSelector = document.getElementById('map-selector');
    this.drawer = document.getElementById('menu-puntos');
    this.drawerList = document.getElementById('drawer-list');
    this.progressEl = document.querySelector('.progress');
    
    this.init();
  }

  init() {
    this.renderPhaseFilter();
    this.updateMapSelector();
  }

  // ========= FILTRO DE FASES (3 botones superiores) =========
  renderPhaseFilter() {
    this.phaseFilter.innerHTML = PHASES.map(phase => `
      <button 
        class="phase-btn ${phase.id === this.mapManager.currentPhase ? 'active' : ''}" 
        data-phase="${phase.id}"
        style="--phase-color: ${phase.color}"
      >
        <span>${phase.label}</span>
      </button>
    `).join('');

    // Event listeners
    this.phaseFilter.querySelectorAll('.phase-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const phaseId = btn.dataset.phase;
        this.selectPhase(phaseId);
      });
    });
  }

  async selectPhase(phaseId) {
    if (!this.mapManager.setPhase(phaseId)) return;

    // Actualizar UI
    this.phaseFilter.querySelectorAll('.phase-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.phase === phaseId);
    });

    // Actualizar selector de mapas
    this.updateMapSelector();

    // Cargar primer mapa de la fase
    const maps = this.mapManager.getCurrentPhaseMaps();
    if (maps.length > 0) {
      await this.onPhaseChange(phaseId, maps[0].id);
    }
  }

  // ========= SELECTOR DE MAPAS =========
  updateMapSelector() {
    const maps = this.mapManager.getCurrentPhaseMaps();
    
    this.mapSelector.innerHTML = maps.length > 1 ? `
      <label for="map-select" class="sr-only">Seleccionar mapa</label>
      <select id="map-select" class="map-select">
        ${maps.map((map, idx) => `
          <option value="${map.id}" ${idx === 0 ? 'selected' : ''}>
            ${map.name}
          </option>
        `).join('')}
      </select>
    ` : '';

    // Event listener
    const select = document.getElementById('map-select');
    if (select) {
      select.addEventListener('change', (e) => {
        this.onMapChange(e.target.value);
      });
    }
  }

  // ========= PROGRESO (puntitos) =========
  updateProgress(waypointCount, currentIdx) {
    this.progressEl.innerHTML = Array(waypointCount)
      .fill(0)
      .map((_, i) => `<span class="${i === currentIdx ? 'active' : ''}"></span>`)
      .join('');

    // Click en puntitos
    this.progressEl.querySelectorAll('span').forEach((dot, i) => {
      dot.style.cursor = 'pointer';
      dot.addEventListener('click', () => {
        document.dispatchEvent(new CustomEvent('goto-waypoint', { detail: i }));
      });
    });
  }

  // ========= DRAWER/MENU =========
  updateDrawer(waypoints) {
    this.drawerList.innerHTML = waypoints.map((wp, i) => `
      <li>
        <button type="button" data-index="${i}">
          <span>${i + 1}. ${wp.label || ('Punto ' + (i + 1))}</span>
          <small>${wp.speaker || ''}</small>
        </button>
      </li>
    `).join('');

    // Event listeners
    this.drawerList.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.index);
        document.dispatchEvent(new CustomEvent('goto-waypoint', { detail: idx }));
        this.closeDrawer();
      });
    });
  }

  openDrawer() {
    this.drawer.classList.add('drawer--open');
    this.drawer.setAttribute('aria-hidden', 'false');
    document.querySelector('.hamburger').setAttribute('aria-expanded', 'true');
    document.querySelector('.drawer-backdrop').hidden = false;
  }

  closeDrawer() {
    this.drawer.classList.remove('drawer--open');
    this.drawer.setAttribute('aria-hidden', 'true');
    document.querySelector('.hamburger').setAttribute('aria-expanded', 'false');
    document.querySelector('.drawer-backdrop').hidden = true;
  }

  // ========= LOADING STATE =========
  setLoading(isLoading) {
    const spinner = document.getElementById('loading-spinner');
    if (spinner) {
      spinner.hidden = !isLoading;
    }
  }

  // ========= ACTUALIZAR COLOR DE FASE =========
  updateThemeColor(color, colorRgb) {
    document.documentElement.style.setProperty('--phase-color', color);
    document.documentElement.style.setProperty('--phase-color-rgb', colorRgb);
  }
}