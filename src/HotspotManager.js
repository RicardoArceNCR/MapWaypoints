// HotspotManager.js - Gestión unificada de hotspots con migración progresiva
// Permite cambiar entre DOM overlays y canvas hit-testing sin romper nada

import { CanvasHitTest } from './CanvasHitTest.js';

export class HotspotManager {
  constructor(camera, overlayLayer, popupManager) {
    this.camera = camera;
    this.overlayLayer = overlayLayer;
    this.popupManager = popupManager;
    this.canvasHitTest = new CanvasHitTest(camera);
    
    // Modo de operación: 'dom', 'canvas', o 'hybrid'
    this.mode = 'hybrid'; // Empieza híbrido para migración segura
    
    this.hotspots = new Map();
    this.all = []; // Store all ingested hotspots
    this.canvas = null;
    this.isProcessing = false;
    this.lastTapTime = 0;
    
    this.init();
  }

  init() {
    this.canvas = document.getElementById('mapa-canvas');
    if (!this.canvas) {
      console.error('Canvas no encontrado');
      return;
    }

    // Solo agregar listeners al canvas si no están en modo DOM puro
    if (this.mode !== 'dom') {
      this.setupCanvasListeners();
    }

    // Toggle de modo via query string o config
    const params = new URLSearchParams(window.location.search);
    if (params.has('hotspot_mode')) {
      this.setMode(params.get('hotspot_mode'));
    }

    // Exponer globalmente para debug
    window.hotspotManager = this;
  }

  /**
   * Ingest hotspots from config, filtering by device type
   * @param {Object} config - The configuration object containing WAYPOINTS
   * @param {boolean} isMobile - Whether the current device is mobile
   */
  ingestFromConfig(config, isMobile) {
    const wps = Array.isArray(config?.WAYPOINTS) ? config.WAYPOINTS : [];
    this.all = [];
    
    wps.forEach((wp, i) => {
      const node = isMobile ? wp?.mobile : wp?.desktop;
      const list = Array.isArray(node?.hotspots) ? node.hotspots : [];
      
      // Normalize and ensure waypointIndex
      list.forEach((h, idx) => {
        if (!h) return;
        this.all.push({
          ...h,
          index: idx,
          waypointIndex: (h.waypointIndex ?? i),
          // Defensive flags
          enabled: (h.enabled !== false),
          type: h.type || 'rect'
        });
      });
    });
    
    console.log('[HotspotManager] total ingestado =', this.all.length);
  }

  /**
   * Get visible hotspots for the active waypoint
   * @param {number} activeWp - The active waypoint index
   * @returns {Array} Array of visible hotspots
   */
  getVisibleFor(activeWp) {
    const visibleHotspots = this.all.filter(h => h.enabled && h.waypointIndex === activeWp);
    console.log('[HotspotManager] visibles para wp', activeWp, '→', visibleHotspots.length, visibleHotspots);
    return visibleHotspots;
  }

  setMode(mode) {
    if (!['dom', 'canvas', 'hybrid'].includes(mode)) {
      console.warn('Modo inválido:', mode);
      return;
    }

    console.log(`🔄 Cambiando modo de hotspots: ${this.mode} → ${mode}`);
    this.mode = mode;

    // Ajustar comportamiento según modo
    if (mode === 'dom') {
      // Solo overlays DOM (comportamiento actual)
      this.disableCanvasListeners();
      this.overlayLayer.setVisible(true);
      if (this.overlayLayer.root) {
        this.overlayLayer.root.style.pointerEvents = 'auto';
      }
    } else if (mode === 'canvas') {
      // Solo hit-testing en canvas
      this.enableCanvasListeners();
      this.overlayLayer.setVisible(false); // Ocultar overlays
    } else {
      // Híbrido: canvas para hit-test, DOM para visuales
      this.enableCanvasListeners();
      this.overlayLayer.setVisible(true);
      // Desactivar eventos en overlays para que no interfieran
      if (this.overlayLayer.root) {
        this.overlayLayer.root.style.pointerEvents = 'none';
      }
    }
  }

  setupCanvasListeners() {
    if (!this.canvas) return;

    // Remover listeners previos si existen
    this.disableCanvasListeners();

    // Handlers con binding correcto
    this._onPointerDown = this.onPointerDown.bind(this);
    this._onPointerUp = this.onPointerUp.bind(this);
    this._onPointerMove = this.onPointerMove.bind(this);
    // Cooldown anti-doble tap
    this._tapCooldownMs = 500;

    this.canvas.addEventListener('pointerdown', this._onPointerDown, { passive: false });
    this.canvas.addEventListener('pointerup', this._onPointerUp, { passive: false });
    this.canvas.addEventListener('pointermove', this._onPointerMove, { passive: true });
  }

  enableCanvasListeners() {
    if (!this._onPointerDown) {
      this.setupCanvasListeners();
    }
  }

  disableCanvasListeners() {
    if (!this.canvas || !this._onPointerDown) return;

    this.canvas.removeEventListener('pointerdown', this._onPointerDown);
    this.canvas.removeEventListener('pointerup', this._onPointerUp);
    this.canvas.removeEventListener('pointermove', this._onPointerMove);
  }

  // === Canvas input ===
  onPointerDown(ev) {
    // noop por ahora (si necesitas long-press, que NO dispare click al soltar)
  }

  onPointerMove(_ev) {
    // opcional: hover/debug
  }

  onPointerUp(ev) {
    if (this.mode === 'dom') return; // canvas no decide en DOM
    
    const now = performance.now();
    if (now - (this.lastTapTime || 0) < this._tapCooldownMs) {
      ev.preventDefault(); 
      ev.stopPropagation(); 
      ev.stopImmediatePropagation();
      return;
    }
    this.lastTapTime = now;

    const t = ev.changedTouches?.[0] || ev;
    const activeWp = this.activeWaypointIndex;
    const hs = this.canvasHitTest.hitAt(t.clientX, t.clientY, activeWp);

    // Siempre corta bubbling; canvas es la fuente de verdad en hybrid/canvas
    ev.preventDefault(); 
    ev.stopPropagation(); 
    ev.stopImmediatePropagation();

    if (!hs) return;             // ❗ Nada de "popup genérico" ni avanzar waypoint
    
    // 🧪 NUEVO (opcional): log de telemetría del toque
    if (window.appConfig?.toggles?.hitlog) {
      const world = this.canvasHitTest.screenToWorld(t.clientX, t.clientY);
      console.table({
        wp: this.activeWaypointIndex,
        id: hs?.id,
        title: hs?.data?.title || hs?.title,
        screen: { x: t.clientX, y: t.clientY },
        world
      });
    }
    
    if (!this.popupManager) return;
    
    // Asegura API explícita por objeto
    if (typeof this.popupManager.openFromHotspot === 'function') {
      this.popupManager.openFromHotspot(hs);
      return;
    }
    
    // Fallback a API vieja si existe
    if (typeof this.popupManager.openPopup === 'function') {
      this.popupManager.openPopup(hs);
    }

    // Notificar evento
    window.dispatchEvent(new CustomEvent('hotspot:tap', { 
      detail: { hotspot: hs, mode: this.mode }
    }));
  }

  onPointerMove(ev) {
    // Opcional: cambiar cursor cuando está sobre hotspot
    if (this.mode === 'dom') return;

    const hotspot = this.canvasHitTest.hitTest(ev.clientX, ev.clientY);
    this.canvas.style.cursor = hotspot ? 'pointer' : 'default';
  }

  // Actualiza hotspots desde la app
  updateHotspots(hotspots, waypointIndex) {
    this.hotspots.clear();
    
    // Convertir formato y almacenar
    const processedHotspots = [];
    
    hotspots.forEach((hs, index) => {
      const processed = {
        id: hs.id || hs.key || `wp${hs.meta?.waypointIndex ?? waypointIndex}-idx${index}`,
        key: hs.key || hs.id || `wp${hs.meta?.waypointIndex ?? waypointIndex}-idx${index}`,
        // usa world* si vienen, si no, las coords ya normalizadas (x,y)
        worldX: hs.worldX ?? hs.x,
        worldY: hs.worldY ?? hs.y,
        // tamaño de hitbox: usa explícitos y si no, deriva de width/height/meta.visualH
        worldWidth: hs.lockWidthPx ?? hs.width ?? 50,
        worldHeight: hs.visualH ?? hs.height ?? hs.meta?.visualH ?? hs.width ?? 50,
        shape: hs.meta?.shape || hs.shape || 'rect',
        waypointIndex: (hs.meta?.waypointIndex ?? waypointIndex),
        data: { ...hs, ...hs.meta }, // deja todo disponible para el popup detallado
        z: Number.isFinite(hs.z) ? hs.z : 1
      };
      
      this.hotspots.set(processed.key, processed);
      processedHotspots.push(processed);
    });

    // Actualizar hit-tester del canvas
    this.canvasHitTest.updateHotspots(processedHotspots, waypointIndex);

    // En modo híbrido o DOM, actualizar overlays también
    if (this.mode !== 'canvas') {
      // Los overlays se actualizan desde app.js normalmente
    }
  }

  // Dibuja áreas de debug en el canvas
  drawDebug(ctx) {
    if (this.mode === 'dom') return;
    
    // Activar/desactivar debug
    this.canvasHitTest.debug = window.GLOBAL_CONFIG?.DEBUG_HOTSPOTS || false;
    this.canvasHitTest.drawDebug(ctx);
  }

  // Limpia todo
  clear() {
    this.hotspots.clear();
    this.canvasHitTest.clear();
    this.pointerDownData = null;
  }

  // API de compatibilidad con código existente
  setVisible(visible) {
    if (this.mode === 'canvas') {
      // En modo canvas puro no hay nada visual que ocultar
      return;
    }
    this.overlayLayer.setVisible(visible);
  }

  beginFrame() {
    // Update canvas hit test with current hotspots and active waypoint
    if (this.mode !== 'dom') {  // Update for both 'canvas' and 'hybrid' modes
      const hotspotList = Array.from(this.hotspots.values());
      this.canvasHitTest.updateHotspots(hotspotList, this.activeWaypointIndex);
    }
    
    // Update overlay layer if in DOM or hybrid mode
    if (this.mode !== 'canvas') {
      this.overlayLayer.beginFrame();
    }
  }

  endFrame(camera, canvasW, canvasH, activeWaypointIndex) {
    if (this.mode !== 'canvas') {
      this.overlayLayer.endFrame(camera, canvasW, canvasH, activeWaypointIndex);
    }
  }

  upsert(options) {
    // Guardar para hit-testing
    if (options.meta?.isHotspot) {
      const hs = {
        key: options.key,
        worldX: options.worldX,
        worldY: options.worldY,
        lockWidthPx: options.lockWidthPx,
        visualH: options.meta?.visualH,
        shape: options.meta?.shape,
        meta: options.meta,
        z: options.z
      };
      
      // Actualizar lista interna
      const hotspotList = Array.from(this.hotspots.values());
      hotspotList.push(hs);
      this.updateHotspots(hotspotList, options.meta?.waypointIndex);
    }

    // En modo canvas puro, no actualizar overlays DOM
    if (this.mode === 'canvas') {
      return;
    }

    // Pasar a overlay para renderizado visual
    this.overlayLayer.upsert(options);
  }
}