// OverlayLayer.js - VERSIÓN PARCHEADA CON FIXES MOBILE
// ========= 🎭 OVERLAY LAYER - GESTIÓN DE ELEMENTOS HTML SOBRE EL CANVAS =========
// Características: Posicionamiento absoluto, escalado, rotación, culling, orden Z, eventos táctiles
// 🔧 FIXES APLICADOS:
// 1. Event bubbling eliminado (stopPropagation + bubbles: false)
// 2. Waypoint-aware culling implementado
// 3. pointer-events: none en hotspots ocultos

import { GLOBAL_CONFIG } from './config.js';
import { Camera } from './Camera.js';

export class OverlayLayer {
  constructor(rootEl) {
    this.root = rootEl;
    this.items = new Map();
    this.frameLiveKeys = new Set();
    this.lastDims = { w: 0, h: 0 };
    this.device = 'mobile';
    this._visible = true;

    this.touchTargetMin = window.matchMedia('(max-width: 899px)').matches ? 30 : 40;

    this._onPointerDown = this._onPointerDown.bind(this);
    this._onPointerUp = this._onPointerUp.bind(this);
  }

  resize(w, h) { this.lastDims = { w, h }; }
  setDevice(device) { this.device = device; }

  setVisible(show) {
    this._visible = !!show;
    if (!this.root) return;
    if (this._visible) {
      this.root.style.visibility = 'visible';
      this.root.style.pointerEvents = '';
      this.root.removeAttribute('aria-hidden');
    } else {
      this.root.style.visibility = 'hidden';
      this.root.style.pointerEvents = 'none';
      this.root.setAttribute('aria-hidden', 'true');
    }
  }

  isVisible() { return !!this._visible; }

  beginFrame() {
    this.frameLiveKeys.clear();
    if (!this._visible) return;
  }

  upsert(opt) {
    const {
      key, src, worldX, worldY,
      rotationDeg = 0, lockWidthPx = 36,
      z = 0, meta = {}
    } = opt;

    let rec = this.items.get(key);
    if (!rec) {
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
      img.alt = '';
      img.src = src;
      img.style.display = 'block';
      img.style.pointerEvents = 'none';

      if (meta?.title) {
        wrap.setAttribute('aria-label', meta.title);
      }

      img.onerror = () => {
        img.style.visibility = 'hidden';
        wrap.dataset.loadError = '1';
      };

      wrap.appendChild(img);
      this.root.appendChild(wrap);

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

  worldToScreen(x, y, camera, canvasW, canvasH) {
    const sx = (x - camera.x) * camera.z + (canvasW / 2);
    const sy = (y - camera.y) * camera.z + (canvasH / 2);
    return { x: sx, y: sy };
  }

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
   * 🔧 MODIFICADO: Ahora acepta activeWaypointIndex para culling por waypoint
   * @param {Camera} camera - Instancia de cámara
   * @param {number} canvasW - Ancho del canvas
   * @param {number} canvasH - Alto del canvas
   * @param {number|null} activeWaypointIndex - Índice del waypoint actual (null = sin filtro)
   */
  endFrame(camera, canvasW, canvasH, activeWaypointIndex = null) {
    if (!this.root) return;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    
    const canvasEl = document.getElementById('mapa-canvas');
    const canvasRect = canvasEl?.getBoundingClientRect();
    const wrapperRect = this.root?.parentElement?.getBoundingClientRect();
    
    const offX = canvasRect && wrapperRect ? (canvasRect.left - wrapperRect.left) : 0;
    const offY = canvasRect && wrapperRect ? (canvasRect.top - wrapperRect.top) : 0;
    
    let viewportBounds = null;
    if (camera.getWorldBounds) {
      viewportBounds = camera.getWorldBounds();
    }

    for (const [key, rec] of this.items) {
      const alive = this.frameLiveKeys.has(String(key));
      if (!alive) {
        rec.wrap.removeEventListener('pointerdown', this._onPointerDown);
        rec.wrap.removeEventListener('pointerup', this._onPointerUp);
        rec.wrap.remove();
        this.items.delete(key);
        continue;
      }

      // ✅ NUEVO: Culling por waypoint
      // Si tenemos un waypoint activo y el hotspot pertenece a otro waypoint, ocultarlo
      if (activeWaypointIndex !== null && 
          rec.meta?.waypointIndex !== undefined && 
          rec.meta.waypointIndex !== activeWaypointIndex) {
        rec.wrap.style.display = 'none';
        rec.wrap.style.pointerEvents = 'none';  // 🔧 Deshabilitar completamente
        continue;
      }

      // Skip if outside viewport bounds (if camera supports it)
      if (viewportBounds) {
        const margin = 500 / camera.z;
        if (rec.worldX < viewportBounds.minX - margin ||
            rec.worldX > viewportBounds.maxX + margin ||
            rec.worldY < viewportBounds.minY - margin ||
            rec.worldY > viewportBounds.maxY + margin) {
          rec.wrap.style.display = 'none';
          continue;
        }
      }

      // world → screen using camera's worldToCss method if available
      let sx, sy;
      if (camera.worldToCss) {
        const screenPos = camera.worldToCss(rec.worldX, rec.worldY);
        sx = screenPos.x;
        sy = screenPos.y;
      } else {
        sx = (rec.worldX - camera.x) * camera.z + (canvasW / 2);
        sy = (rec.worldY - camera.y) * camera.z + (canvasH / 2);
      }

      // Additional culling check (screen space)
      const margin = 500;
      if (sx < -margin || sy < -margin || sx > vw + margin || sy > vh + margin) {
        rec.wrap.style.display = 'none';
        continue;
      } else {
        rec.wrap.style.display = 'block';
        rec.wrap.style.pointerEvents = 'auto';  // 🔧 Restaurar interacción
      }

      const visualW = rec.lockWidthPx;
      const visualH = Number(rec.meta?.visualH || visualW);
      const hitSlop = Number(rec.meta?.hitSlop || GLOBAL_CONFIG.TOUCH.hitSlop);
      
      const compact = !!rec.meta?.compact;
      const minTap = compact ? 0 : Number(rec.meta?.minTap || GLOBAL_CONFIG.TOUCH.mobileMin);

      const hitW = (compact ? visualW : Math.max(visualW, minTap)) + hitSlop * 2;
      const hitH = (compact ? visualH : Math.max(visualH, minTap)) + hitSlop * 2;
      
      rec.hitW = hitW;
      rec.hitH = hitH;
      
      sx += offX;
      sy += offY;
      
      rec.wrap.style.width = `${visualW}px`;
      rec.wrap.style.height = `${visualH}px`;
      rec.wrap.style.transform = `translate(${sx}px, ${sy}px) translate(-50%,-50%) rotate(${rec.rotationDeg}deg)`;
      rec.wrap.style.zIndex = Math.round(1000 + (rec.z * 100) + (rec.worldY / 1000));
      
      if (GLOBAL_CONFIG.DEBUG_HOTSPOTS) {
        rec.wrap.classList.add('debug-hotspot');
        
        const debugBorderWidth = 3;
        rec.wrap.style.border = `${debugBorderWidth}px solid rgba(255, 0, 0, 0.8)`;
        rec.wrap.style.background = 'rgba(255, 0, 0, 0.1)';
        rec.wrap.style.borderRadius = (rec.meta?.shape === 'circle') ? '50%' : '8px';
        rec.wrap.style.boxShadow = '0 0 0 1px white, 0 0 0 2px rgba(0,0,0,0.3)';
        rec.wrap.style.transition = 'all 0.15s ease-out';
        
        let debugLabel = rec.wrap.querySelector('.hs-debug-label');
        if (!debugLabel) {
          debugLabel = document.createElement('div');
          debugLabel.className = 'hs-debug-label';
          rec.wrap.appendChild(debugLabel);
        }
        debugLabel.textContent = `${rec.key || '?'}: ${~~rec.hitW}×${~~rec.hitH}px`;
      } else {
        rec.wrap.classList.remove('debug-hotspot');
        rec.wrap.style.border = 'none';
        rec.wrap.style.background = 'transparent';
        rec.wrap.style.boxShadow = 'none';
        rec.wrap.style.transition = '';
        
        const debugLabel = rec.wrap.querySelector('.hs-debug-label');
        if (debugLabel) debugLabel.remove();
      }

      const img = rec.img;
      const im = img.style;
      if (im.position !== 'absolute') im.position = 'absolute';
      if (im.left !== '50%')  im.left = '50%';
      if (im.top  !== '50%')  im.top  = '50%';
      const imgTransform = `translate(-50%,-50%) rotate(0deg)`;
      if (im.transform !== imgTransform) im.transform = imgTransform;
      if (im.width  !== `${visualW}px`) im.width  = `${visualW}px`;
      if (im.height !== `${visualH}px`) im.height = `${visualH}px`;
    }
  }

  _onPointerDown(ev) {
    const wrap = ev.currentTarget;
    const key = wrap?.dataset?.key;
    if (!key) return;
    const rec = this.items.get(key);
    rec._pd = { x: ev.clientX, y: ev.clientY, t: performance.now() };
  }

  /**
   * 🔧 MODIFICADO: Event bubbling eliminado, stopPropagation agregado
   */
  _onPointerUp(ev) {
    const wrap = ev.currentTarget;
    const key = wrap?.dataset?.key;
    if (!key) return;
    const rec = this.items.get(key);
    const dx = Math.abs(ev.clientX - rec._pd.x);
    const dy = Math.abs(ev.clientY - rec._pd.y);
    const dt = performance.now() - rec._pd.t;

    if (dx <= 8 && dy <= 8 && dt <= 500) {
      // ✅ FIX CRÍTICO: Detener propagación para evitar que el click llegue al canvas
      ev.stopPropagation();
      ev.preventDefault();

      if (!GLOBAL_CONFIG.SHOW_POPUP_ON_CLICK) {
        console.log(`[INFO] Popup disabled via SHOW_POPUP_ON_CLICK for hotspot ${key}`);
        return;
      }

      if (GLOBAL_CONFIG.DEBUG_HOTSPOTS) {
        const hotspotData = rec.meta?.hotspot || rec.meta;
        
        if (!hotspotData) {
          console.warn(`[DEBUG] No hay metadata para hotspot ${key}`);
          return;
        }
        
        if (window.popupManager) {
          console.log(`[DEBUG] Abriendo popup directo para hotspot ${key}:`, hotspotData.title || 'Sin título');
          window.popupManager.openPopup(hotspotData);
        } else {
          console.warn(`[DEBUG] No se puede abrir popup: popupManager no está disponible`);
        }
      } else {
        // ✅ FIX CRÍTICO: Cambiar bubbles a false
        this.root.dispatchEvent(new CustomEvent('overlay:click', {
          bubbles: false,  // 🔧 ANTES: true (causaba el problema)
          detail: { key, record: rec }
        }));
      }
    }
  }
}