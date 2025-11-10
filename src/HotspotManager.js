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

  onPointerDown(ev) {
    if (this.mode === 'dom') return;

    this.pointerDownData = {
      x: ev.clientX,
      y: ev.clientY,
      time: performance.now()
    };
  }

  onPointerUp(ev) {
    if (this.mode === 'dom') return;
    if (!this.pointerDownData) return;

    const now = performance.now();
    const dx = Math.abs(ev.clientX - this.pointerDownData.x);
    const dy = Math.abs(ev.clientY - this.pointerDownData.y);
    const dt = now - this.pointerDownData.time;

    // Reset para siguiente evento
    this.pointerDownData = null;

    // Verificar que fue un tap (no un drag)
    if (dx > 10 || dy > 10 || dt > 500) return;

    // Cooldown para evitar taps múltiples
    if (now - this.lastTapTime < 300) return;
    this.lastTapTime = now;

    // Hit test
    const hotspot = this.canvasHitTest.hitTest(ev.clientX, ev.clientY);
    
    if (hotspot) {
      // Hotspot encontrado - abrir popup
      ev.preventDefault();
      ev.stopPropagation();
      
      console.log('🎯 Hotspot hit (canvas):', hotspot.id);
      
      if (this.popupManager && hotspot.data) {
        this.popupManager.openPopup({
          title: hotspot.data.title || `Hotspot ${hotspot.id}`,
          description: hotspot.data.description || 'Sin descripción',
          ...hotspot.data
        });
      }

      // Notificar evento
      window.dispatchEvent(new CustomEvent('hotspot:tap', { 
        detail: { hotspot, mode: this.mode }
      }));
      
      // Prevenir que se avance el waypoint
      window.__lastHotspotClickTime = now;
    }
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
        id: hs.key || `hotspot_${index}`,
        worldX: hs.worldX || hs.x,
        worldY: hs.worldY || hs.y,
        worldWidth: hs.lockWidthPx || hs.width || 50,
        worldHeight: hs.visualH || hs.height || 50,
        shape: hs.meta?.shape || hs.shape || 'rect',
        waypointIndex: hs.meta?.waypointIndex,
        data: hs.meta || hs,
        z: hs.z || 1
      };
      
      this.hotspots.set(processed.id, processed);
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