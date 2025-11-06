// OverlayLayer.js
// Capa screen-space para overlays DOM con ancho fijo en px y rotación.
// ========= 🎭 OVERLAY LAYER - GESTIÓN DE ELEMENTOS HTML SOBRE EL CANVAS =========
// Características: Posicionamiento absoluto, escalado, rotación, culling, orden Z, eventos táctiles
import { GLOBAL_CONFIG } from './config.js';
import { Camera } from './Camera.js';

// Margen de culling en píxeles CSS (se ajusta según el zoom)
const CULL_MARGIN_CSS = 320; // Ajustar según necesidad

export class OverlayLayer {
  constructor(rootEl) {
    this.root = rootEl;
    this.items = new Map();
    this.frameLiveKeys = new Set();
    this.lastDims = { w: 0, h: 0 };
    this.device = 'mobile';

    // 🆕 Target táctil mínimo
    this.touchTargetMin = window.matchMedia('(max-width: 899px)').matches ? 56 : 40;

    this._onPointerDown = this._onPointerDown.bind(this);
    this._onPointerUp = this._onPointerUp.bind(this);
  }

  resize(w, h) { this.lastDims = { w, h }; }
  setDevice(device) { this.device = device; } // 'mobile' | 'desktop'

  /**
   * Calculates the tap target rectangle with zoom-aware hit slop
   * @param {Object} meta - Item metadata including hitSlop and minTap
   * @param {number} sx - Screen X position
   * @param {number} sy - Screen Y position
   * @param {number} zoom - Current camera zoom level
   * @param {number} [width] - Optional visual width
   * @param {number} [height] - Optional visual height
   * @returns {Object} The tap target rectangle
   */
  _computeTapRect(meta, sx, sy, zoom, width, height) {
    // Default to config values if not specified
    const minTap = meta?.minTap ?? GLOBAL_CONFIG.TOUCH.mobileMin;
    const baseSlop = meta?.hitSlop ?? GLOBAL_CONFIG.TOUCH.hitSlop;
    
    // Adjust slop based on zoom - smaller slop when zoomed in, larger when zoomed out
    // But never go below 2px to ensure touch targets remain usable
    const slop = Math.max(2, baseSlop / Math.max(1, zoom));
    
    // Use provided dimensions or fall back to minimum tap target size
    const w = width !== undefined ? Math.max(minTap, width) : minTap;
    const h = height !== undefined ? Math.max(minTap, height) : minTap;
    
    // Calculate tap rectangle centered on (sx, sy)
    const halfW = (w / 2) + slop;
    const halfH = (h / 2) + slop;
    
    return {
      left: Math.round(sx - halfW),
      top: Math.round(sy - halfH),
      right: Math.round(sx + halfW),
      bottom: Math.round(sy + halfH),
      width: Math.round(w + slop * 2),
      height: Math.round(h + slop * 2)
    };
  }

  beginFrame() {
    this.frameLiveKeys.clear();
  }

  /**
   * Upsert de un item de overlay.
   * @param {Object} opt
   *  - key: id único (string|number)
   *  - src: ruta de la imagen
   *  - worldX, worldY: coords en sistema "mundo" del canvas
   *  - rotationDeg: rotación en grados
   *  - lockWidthPx: ancho fijo en px de pantalla
   *  - z: (opcional) orden visual
   *  - meta: (opcional) payload para popups, etc.
   */
  upsert(opt) {
    const {
      key, src, worldX, worldY,
      rotationDeg = 0, lockWidthPx = 36,
      z = 0, meta = {}
    } = opt;

    let rec = this.items.get(key);
    if (!rec) {
      // 🆕 wrapper + img (wrapper = hitbox)
      const wrap = document.createElement('div');
      wrap.className = 'overlay-wrap';
      wrap.dataset.key = String(key);
      wrap.style.position = 'absolute';
      wrap.style.touchAction = 'manipulation';
      wrap.style.userSelect = 'none';

      const img = document.createElement('img');
      img.className = 'overlay-item';
      img.decoding = 'async';
      img.loading = 'lazy';
      img.draggable = false;
      img.alt = ''; // 🖼️ Decorativa; evita texto si la imagen falla
      img.src = src;
      img.style.display = 'block';
      img.style.pointerEvents = 'none'; // 👈 la interacción la toma el wrapper

      // ♿ Accesibilidad en el wrapper (no ensucia UI)
      if (meta?.title) {
        wrap.setAttribute('aria-label', meta.title);
      }

      // 🛟 Manejo de fallos de carga
      img.onerror = () => {
        // Oculta contenido visual fallido (evita ícono roto/texto)
        img.style.visibility = 'hidden';
        // Marca el wrapper para posible retry/logging
        wrap.dataset.loadError = '1';
      };

      wrap.appendChild(img);
      this.root.appendChild(wrap);

      // 🆕 listeners pointer (evita ghost clicks y scroll-move)
      wrap.addEventListener('pointerdown', this._onPointerDown, { passive: true });
      wrap.addEventListener('pointerup', this._onPointerUp, { passive: true });

      rec = { wrap, img, meta, lockWidthPx, worldX, worldY, rotationDeg, z, _pd:{x:0,y:0,t:0} };
      this.items.set(key, rec);
    }

    rec.meta = meta;
    rec.lockWidthPx = lockWidthPx;
    rec.worldX = worldX;
    rec.worldY = worldY;
    rec.rotationDeg = rotationDeg;
    rec.z = z;

    this.frameLiveKeys.add(String(key));
  }

  /**
   * Converts world coordinates to screen coordinates, accounting for camera and fit rectangle
   * @param {number} worldX - X coordinate in world space
   * @param {number} worldY - Y coordinate in world space
   * @param {Object} camera - Camera instance with worldToCss method
   * @param {number} canvasW - Canvas width in CSS pixels
   * @param {number} canvasH - Canvas height in CSS pixels
   * @param {Object} [fitRect] - Optional fit rectangle {x, y, w, h, s} for non-filled viewports
   * @returns {{x: number, y: number}} Screen coordinates in CSS pixels
   */
  worldToScreen(worldX, worldY, camera, canvasW, canvasH, fitRect) {
    // Get base position from camera
    const baseP = camera.worldToCss(worldX, worldY);
    
    // If we have a fitRect, adjust the coordinates to account for the map not filling the viewport
    if (fitRect && fitRect.s) {
      return {
        x: fitRect.x + baseP.x * fitRect.s,
        y: fitRect.y + baseP.y * fitRect.s
      };
    }
    
    // Fallback: simple projection (not recommended for production)
    const scale = camera?.z || 1;
    const offsetX = (canvasW / 2) - (camera?.x * scale || 0);
    const offsetY = (canvasH / 2) - (camera?.y * scale || 0);
    return {
      x: (worldX * scale) + offsetX,
      y: (worldY * scale) + offsetY
    };
  }

  // screen → world (para hit-testing)
  screenToWorld(sx, sy, camera, canvasW, canvasH, fitRect) {
    if (fitRect) {
      // Usar el fit rectangle para la transformación inversa
      const worldX = (sx - fitRect.x) / fitRect.s;
      const worldY = (sy - fitRect.y) / fitRect.s;
      return { x: worldX, y: worldY };
    } else if (camera.cssToWorld) {
      return camera.cssToWorld(sx, sy);
    } else {
      // Fallback implementation
      const worldX = (sx - (canvasW / 2)) / camera.z + camera.x;
      const worldY = (sy - (canvasH / 2)) / camera.z + camera.y;
      return { x: worldX, y: worldY };
    }
  }

  /**
   * Logs debug information about hitbox sizes when they change
   * @private
   */
  _debugLog(rec) {
    if (!rec || !rec.hitW || !rec.hitH || !GLOBAL_CONFIG.DEBUG_HOTSPOTS) return;
    
    if (rec._lastHitW !== rec.hitW || rec._lastHitH !== rec.hitH) {
      console.log(
        `%c🎯 Hitbox [${rec.wrap?.dataset?.key || '?'}]:`,
        'color: #4CAF50; font-weight: bold',
        `${~~rec.hitW}×${~~rec.hitH}px`,
        `(shape: ${rec.meta?.shape || 'rect'})`,
        `@ (${~~rec.worldX}, ${~~rec.worldY})`
      );
      
      // Actualizar etiqueta de debug si existe
      if (rec.wrap) {
        const debugLabel = rec.wrap.querySelector('.hs-debug-label');
        if (debugLabel) {
          debugLabel.textContent = `${rec.key || '?'}: ${~~rec.hitW}×${~~rec.hitH}px`;
        }
      }
      
      rec._lastHitW = rec.hitW;
      rec._lastHitH = rec.hitH;
    }
  }

  /**
   * Pinta/ubica los items vivos del frame (layout y culling en screen-space)
   * Debe llamarse después de upsert(...), antes de limpiar los que no vivieron.
   * @param {Camera} camera
   * @param {number} cssW - ancho del viewport en px CSS
   * @param {number} cssH - alto del viewport en px CSS
   * @param {{x:number,y:number,w:number,h:number,s:number}} [fitRect] - rect de ajuste del mapa (contain/cover)
   */
  endFrame(camera, cssW, cssH, fitRect) {
    this.resize(cssW, cssH);

    // Orden z estable
    const ordered = [];
    this.items.forEach((rec, key) => {
      if (this.frameLiveKeys.has(String(key))) {
        rec.key = key; // para logs/depuración
        ordered.push(rec);
      }
    });
    ordered.sort((a, b) => (a.z || 0) - (b.z || 0));

    // Bounds de culling en pantalla (px CSS)
    const margin = CULL_MARGIN_CSS;
    const left = -margin, top = -margin, right = cssW + margin, bottom = cssH + margin;

    for (const rec of ordered) {
      // world -> screen
      const p = this.worldToScreen(rec.worldX, rec.worldY, camera, cssW, cssH, fitRect);
      const sx = p.x;
      const sy = p.y;

      // Debug: Log DOM overlay positions
      if (GLOBAL_CONFIG.DEBUG_HOTSPOTS && rec.meta?.isHotspot) {
        console.log(`[DEBUG] Overlay DOM: key=${rec.key || 'unknown'}, world=(${rec.worldX.toFixed(1)},${rec.worldY.toFixed(1)}), css=(${sx.toFixed(1)},${sy.toFixed(1)})`);
      }

      // Tamaño visual con lockWidthPx (alto proporcional)
      const w = Math.max(1, rec.lockWidthPx);
      const h = Math.max(1, rec.meta?.lockHeightPx || w); // Usa lockHeightPx si existe, si no usa ancho
      rec.hitW = Math.max(this.touchTargetMin, w);
      rec.hitH = Math.max(this.touchTargetMin, h);

      // Culling en screen-space
      if (sx + rec.hitW * 0.5 < left ||
          sx - rec.hitW * 0.5 > right ||
          sy + rec.hitH * 0.5 < top ||
          sy - rec.hitH * 0.5 > bottom) {
        // fuera: ocultar
        if (rec.wrap) rec.wrap.style.display = 'none';
        continue;
      }

      // Dentro: posicionar/rotar
      if (rec.wrap) {
        rec.wrap.style.display = '';
        const x = Math.round(sx - rec.hitW * 0.5);
        const y = Math.round(sy - rec.hitH * 0.5);

        // layout
        rec.wrap.style.left = x + 'px';
        rec.wrap.style.top = y + 'px';
        rec.wrap.style.width = Math.round(rec.hitW) + 'px';
        rec.wrap.style.height = Math.round(rec.hitH) + 'px';
        
        // rotación
        const rot = rec.rotationDeg || 0;
        rec.wrap.style.transform = rot ? `rotate(${rot}deg)` : '';
        
        // imagen ocupa wrapper
        if (rec.img) {
          rec.img.style.width = '100%';
          rec.img.style.height = '100%';
        }

        // para debug
        if (GLOBAL_CONFIG.DEBUG_HOTSPOTS) {
          this._debugLog(rec);
        }
      }
    }

    // Remover items no "vivos" este frame
    for (const [key, rec] of this.items) {
      if (!this.frameLiveKeys.has(String(key))) {
        if (rec?.wrap?.parentNode === this.root) {
          this.root.removeChild(rec.wrap);
        }
        this.items.delete(key);
      }
    }
  }

  // =================== Pointer Handlers ===================

  _onPointerDown(ev) {
    // Guardar posición inicial para filtrar "scroll vs tap"
    const t = ev.timeStamp || performance.now();
    const rec = this._getRecordFromEvent(ev);
    if (rec) {
      rec._pd = rec._pd || {};
      rec._pd.x = ev.clientX;
      rec._pd.y = ev.clientY;
      rec._pd.t = t;
    }
  }

  _onPointerUp(ev) {
    const rec = this._getRecordFromEvent(ev);
    if (!rec || !rec._pd) return;

    const t = ev.timeStamp || performance.now();
    const dx = Math.abs(ev.clientX - rec._pd.x);
    const dy = Math.abs(ev.clientY - rec._pd.y);
    const dt = t - rec._pd.t;

    // Umbrales simples para considerar "tap"
    const moved = dx > 6 || dy > 6;
    const longPress = dt > 600;

    if (!moved && !longPress) {
      // Disparar evento delegado hacia el root (para popups)
      const key = rec.wrap?.dataset?.key || '';
      const detail = { key, record: rec };
      this.root.dispatchEvent(new CustomEvent('overlay:click', { 
        bubbles: true, 
        detail 
      }));
    }
  }

  _getRecordFromEvent(ev) {
    let el = ev.currentTarget || ev.target;
    // asegúrate de estar en .overlay-wrap
    if (el && !el.classList.contains('overlay-wrap')) {
      el = el.closest('.overlay-wrap');
    }
    if (!el) return null;

    const key = el.dataset.key;
    return this.items.get(key) || null;
  }
}
