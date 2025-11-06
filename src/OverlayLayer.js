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

  // world → screen (px DOM) usando la cámara o fit rectangle
  worldToScreen(x, y, camera, canvasW, canvasH, fitRect) {
    // Primero intenta usar el método worldToCss de la cámara si está disponible
    if (camera?.worldToCss) {
      return camera.worldToCss(x, y);
    }
    
    // Luego intenta usar el fit rectangle si está disponible
    if (fitRect) {
      const sx = fitRect.x + (x * fitRect.s);
      const sy = fitRect.y + (y * fitRect.s);
      return { x: sx, y: sy };
    }
    
    // Fallback: proyección simple (no recomendado para producción)
    const scale = camera?.z || 1;
    const offsetX = (canvasW / 2) - (camera?.x * scale || 0);
    const offsetY = (canvasH / 2) - (camera?.y * scale || 0);
    return {
      x: (x * scale) + offsetX,
      y: (y * scale) + offsetY
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
   * Pinta la posición/rotación/orden final de los items "vivos" del frame.
   * Hace culling barato y evita reflows innecesarios.
   * @param {Object} camera - Instancia de la cámara
   * @param {number} canvasW - Ancho del canvas en píxeles CSS
   * @param {number} canvasH - Alto del canvas en píxeles CSS
   * @param {Object} [fitRect] - Rectángulo de ajuste del mapa {x, y, w, h, s}
   */
  endFrame(camera, canvasW, canvasH, fitRect) {
    const vw = this.lastDims.w || canvasW;
    const vh = this.lastDims.h || canvasH;
    
    // Obtener límites del viewport para culling si la cámara lo soporta
    const worldBounds = typeof camera.getWorldBounds === 'function' ? camera.getWorldBounds() : null;

    for (const [key, rec] of this.items) {
      const alive = this.frameLiveKeys.has(String(key));
      if (!alive) {
        rec.wrap.removeEventListener('pointerdown', this._onPointerDown);
        rec.wrap.removeEventListener('pointerup', this._onPointerUp);
        rec.wrap.remove();
        this.items.delete(key);
        continue;
      }

      // Culling en espacio mundo primero (más barato que proyectar)
      if (worldBounds) {
        const { minX, minY, maxX, maxY } = worldBounds;
        const x = rec.worldX; // pivot world del hotspot
        const y = rec.worldY;
        
        // Ajusta el margen según el zoom (más pequeño cuando más zoom)
        const margin = CULL_MARGIN_CSS / (camera?.z || 1);
        
        if (x < (minX - margin) ||
            x > (maxX + margin) ||
            y < (minY - margin) ||
            y > (maxY + margin)) {
          // Fuera de la vista: ocultar sin forzar layout
          if (rec.wrap) rec.wrap.style.display = 'none';
          continue;
        }
      }

      // Proyecta usando el MISMO fitRect
      const screenPos = this.worldToScreen(rec.worldX, rec.worldY, camera, canvasW, canvasH, fitRect);
      const sx = screenPos.x;
      const sy = screenPos.y;

      // Culling CSS adicional (por si algo falló en la proyección)
      if (sx < -CULL_MARGIN_CSS || 
          sy < -CULL_MARGIN_CSS || 
          sx > (vw + CULL_MARGIN_CSS) || 
          sy > (vh + CULL_MARGIN_CSS)) {
        if (rec.wrap) rec.wrap.style.display = 'none';
        continue;
      } else {
        rec.wrap.style.display = 'block';
      }

      // Calculate visual dimensions
      const visualW = rec.lockWidthPx;
      const visualH = Number(rec.meta?.visualH || visualW);
      
      // Calculate tap target rectangle with zoom-aware hit slop
      const tapRect = this._computeTapRect(
        rec.meta,
        sx,
        sy,
        camera.z,
        visualW,
        visualH
      );
      
      // Store for debug and hit testing
      rec.hitW = tapRect.width;
      rec.hitH = tapRect.height;
      rec.tapRect = tapRect;
      
      // Aplicar estilos al wrap
      rec.wrap.style.width = `${visualW}px`;
      rec.wrap.style.height = `${visualH}px`;
      rec.wrap.style.transform = `translate(${sx}px, ${sy}px) translate(-50%,-50%) rotate(${rec.rotationDeg}deg)`;
      rec.wrap.style.zIndex = Math.round(1000 + (rec.z * 100) + (rec.worldY / 1000));
      
      // Aplicar estilos de debug si está habilitado
      if (GLOBAL_CONFIG.DEBUG_HOTSPOTS) {
        // Añadir clase de debug para estilos CSS
        rec.wrap.classList.add('debug-hotspot');
        
        // Aplicar estilos inline para debug (border más grueso para mejor visibilidad)
        const debugBorderWidth = 3; // Más grueso para mobile
        rec.wrap.style.border = `${debugBorderWidth}px solid rgba(255, 0, 0, 0.8)`;
        rec.wrap.style.background = 'rgba(255, 0, 0, 0.1)';
        rec.wrap.style.borderRadius = (rec.meta?.shape === 'circle') ? '50%' : '8px';
        rec.wrap.style.boxShadow = '0 0 0 1px white, 0 0 0 2px rgba(0,0,0,0.3)';
        rec.wrap.style.transition = 'all 0.15s ease-out';
        
        // Añadir o actualizar etiqueta de debug
        let debugLabel = rec.wrap.querySelector('.hs-debug-label');
        if (!debugLabel) {
          debugLabel = document.createElement('div');
          debugLabel.className = 'hs-debug-label';
          rec.wrap.appendChild(debugLabel);
        }
        debugLabel.textContent = `${rec.key || '?'}: ${~~rec.hitW}×${~~rec.hitH}px`;
      } else {
        // Limpiar estilos de debug
        rec.wrap.classList.remove('debug-hotspot');
        rec.wrap.style.border = 'none';
        rec.wrap.style.background = 'transparent';
        rec.wrap.style.boxShadow = 'none';
        rec.wrap.style.transition = '';
        
        // Eliminar etiqueta de debug si existe
        const debugLabel = rec.wrap.querySelector('.hs-debug-label');
        if (debugLabel) debugLabel.remove();
      }

      // imagen centrada (mantén ancho/alto visuales)
      const img = rec.img;
      const im = img.style;
      if (im.position !== 'absolute') im.position = 'absolute';
      if (im.left !== '50%')  im.left = '50%';
      if (im.top  !== '50%')  im.top  = '50%';
      const imgTransform = `translate(-50%,-50%) rotate(0deg)`; // ya rota el wrapper
      if (im.transform !== imgTransform) im.transform = imgTransform;
      if (im.width  !== `${visualW}px`) im.width  = `${visualW}px`;
      if (im.height !== `${visualH}px`) im.height = `${visualH}px`; // 🆕 antes 'auto'
    }
  }

    
    rec._lastHitW = rec.hitW;
    rec._lastHitH = rec.hitH;
  }
    // 🆕 "fat-finger forgiveness": solo click si no se arrastró
    if (dx <= 8 && dy <= 8 && dt <= 500) {
      // 🆕 Verifica toggle global antes de cualquier acción
      if (!GLOBAL_CONFIG.SHOW_POPUP_ON_CLICK) {
        console.log(`[INFO] Popup disabled via SHOW_POPUP_ON_CLICK for hotspot ${key}`);
        return;  // Sale temprano si popups están desactivados
      }

      // 🆕 Prioriza modo debug como principal si activo
      if (GLOBAL_CONFIG.DEBUG_HOTSPOTS) {
        const hotspotData = rec.meta?.hotspot || rec.meta;
        
        if (!hotspotData) {
          console.warn(`[DEBUG] No hay metadata para hotspot ${key}`);
          return;  // 🆕 Salir si no hay metadata
        }
        
        if (window.popupManager) {
          console.log(`[DEBUG] Abriendo popup directo para hotspot ${key}:`, hotspotData.title || 'Sin título');
          window.popupManager.openPopup(hotspotData);  // Trigger directo (principal en debug)
        } else {
          console.warn(`[DEBUG] No se puede abrir popup: popupManager no está disponible`);
        }
      } else {
        // Fallback al evento original si no en debug
        this.root.dispatchEvent(new CustomEvent('overlay:click', {
          bubbles: true,
          detail: { key, record: rec }
        }));
      }
    }
  }
}
