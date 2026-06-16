// OverlayLayer.js
// Capa screen-space para overlays DOM con ancho fijo en px y rotación.
// ========= 🎭 OVERLAY LAYER - GESTIÓN DE ELEMENTOS HTML SOBRE EL CANVAS =========
// Características: Posicionamiento absoluto, escalado, rotación, culling, orden Z, eventos táctiles
import { GLOBAL_CONFIG } from './config.js';
import { Camera } from './Camera.js';

export class OverlayLayer {
  constructor(rootEl) {
    this.root = rootEl;
    this.items = new Map();
    this.frameLiveKeys = new Set();
    this.lastDims = { w: 0, h: 0 };
    this.device = 'mobile';

    // 🆕 Target táctil mínimo
    this.touchTargetMin = window
      .matchMedia(`(max-width: ${GLOBAL_CONFIG.MOBILE_BREAKPOINT - 1}px)`)
      .matches ? 56 : 40;

    this._cachedOffX = 0;
    this._cachedOffY = 0;

    this._onPointerDown = this._onPointerDown.bind(this);
    this._onPointerUp = this._onPointerUp.bind(this);

    // 📱 Mobile: cerrar tooltip ⓘ con cualquier tap fuera del badge
    if (window.matchMedia('(hover: none)').matches) {
      document.addEventListener('pointerdown', (e) => {
        if (!e.target.closest('.hs-caption__badge')) {
          document.querySelectorAll('.hs-caption.is-open')
            .forEach(el => el.classList.remove('is-open'));
        }
      }, { capture: true, passive: true });
    }
  }

  _recalcOffsets() {
    const canvasEl = document.getElementById('mapa-canvas');
    const canvasRect = canvasEl?.getBoundingClientRect();
    const wrapperRect = this.root?.parentElement?.getBoundingClientRect();
    this._cachedOffX = canvasRect && wrapperRect ? (canvasRect.left - wrapperRect.left) : 0;
    this._cachedOffY = canvasRect && wrapperRect ? (canvasRect.top - wrapperRect.top) : 0;
  }

  resize(w, h) {
    this.lastDims = { w, h };
    this.logicalW = w;
    this.logicalH = h;
    this._recalcOffsets();
  }
  setDevice(device) { this.device = device; } // 'mobile' | 'desktop'

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

    if (!src || src === 'undefined') return;

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

      // 💬 Caption badge — solo si meta.caption existe
      if (meta?.caption && GLOBAL_CONFIG.SHOW_CAPTION_BADGES) {
        const caption = document.createElement('div');
        caption.className = 'hs-caption hs-caption--hidden'; // 👈 nace oculto, app.js lo revela
        caption.setAttribute('aria-hidden', 'true');
        caption.innerHTML = `
          <div class="hs-caption__badge">
            <svg width="18" height="18" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <circle cx="7" cy="7" r="6.5" stroke="currentColor"/>
              <rect x="6.5" y="5.5" width="1" height="5" rx=".5" fill="currentColor"/>
              <circle cx="7" cy="3.5" r=".75" fill="currentColor"/>
            </svg>
          </div>
          <div class="hs-caption__tooltip">${meta.caption}</div>
        `;
        wrap.appendChild(caption);
        wrap.classList.add('has-caption');

        // Cancelar auto-announce si el usuario interactúa con el badge
        const badgeEl = caption.querySelector('.hs-caption__badge');
        const _cancelAnnounce = () => {
          window._badgeAnnounceCancelled = true;
          document.querySelectorAll('.overlay-wrap.hs-announcing').forEach(w => w.classList.remove('hs-announcing'));
        };
        badgeEl.addEventListener('mouseenter', _cancelAnnounce);

        // 🖱️ Click en badge ⓘ → badge:click → app.js abre el hotspot principal del waypoint
        badgeEl.addEventListener('click', (e) => {
          e.stopPropagation();
          _cancelAnnounce();

          if (!GLOBAL_CONFIG.SHOW_POPUP_ON_CLICK) return;

          this.root.dispatchEvent(new CustomEvent('badge:click', {
            bubbles: true,
            detail: { key }
          }));
        });
      }

      this.root.appendChild(wrap);

      // 🆕 listeners pointer (evita ghost clicks y scroll-move)
      if (!meta?.noPopup) {
        wrap.addEventListener('pointerdown', this._onPointerDown, { passive: true });
        wrap.addEventListener('pointerup', this._onPointerUp, { passive: true });
      }

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

  // world → screen (px DOM) con cámara del canvas
  worldToScreen(x, y, camera, canvasW, canvasH) {
    const sx = (x - camera.x) * camera.z + (canvasW / 2);
    const sy = (y - camera.y) * camera.z + (canvasH / 2);
    return { x: sx, y: sy };
  }

  /**
   * Logs debug information about hitbox sizes when they change
   * @private
   */
  _debugLog(rec) {
    if (!rec || !rec.hitW || !rec.hitH || !GLOBAL_CONFIG.DEBUG_OVERLAY_WRAPS) return;
    
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
   * Paints the final position/rotation/order of "live" frame items.
   * Performs cheap culling and avoids unnecessary reflow.
   */
  endFrame(camera, canvasW, canvasH) {
    if (!this.root) return;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    
    const offX = this._cachedOffX;
    const offY = this._cachedOffY;

    for (const [key, rec] of this.items) {
      const alive = this.frameLiveKeys.has(String(key));
      if (!alive) {
        rec.wrap.removeEventListener('pointerdown', this._onPointerDown);
        rec.wrap.removeEventListener('pointerup', this._onPointerUp);
        rec.wrap.remove();
        this.items.delete(key);
        continue;
      }

      // world → screen using camera's worldToCss method if available
      let sx, sy;
      if (camera.worldToCss) {
        const screenPos = camera.worldToCss(rec.worldX, rec.worldY);
        sx = screenPos.x;
        sy = screenPos.y;
      } else {
        // Fallback to manual calculation
        sx = (rec.worldX - camera.x) * camera.z + (canvasW / 2);
        sy = (rec.worldY - camera.y) * camera.z + (canvasH / 2);
      }

      // Additional culling check (screen space)
      const margin = 500; // pixels
      if (sx < -margin || sy < -margin || sx > vw + margin || sy > vh + margin) {
        rec.wrap.style.display = 'none';
        rec._screenX = null;
        rec._screenY = null;
        continue;
      } else {
        rec.wrap.style.display = 'block';
      }

      // 🆕 hitbox: control preciso de dimensiones
      const visualW = rec.lockWidthPx;
      const visualH = Number(rec.meta?.visualH || visualW);
      const hitSlop = Number(rec.meta?.hitSlop || GLOBAL_CONFIG.TOUCH.hitSlop);
      
      // 🎯 Modo compacto: usa tamaño visual exacto
      const compact = !!rec.meta?.compact;
      const minTap = compact ? 0 : Number(rec.meta?.minTap || GLOBAL_CONFIG.TOUCH.mobileMin);

      // Calcula hitbox respetando modo compacto
      const hitW = (compact ? visualW : Math.max(visualW, minTap)) + hitSlop * 2;
      const hitH = (compact ? visualH : Math.max(visualH, minTap)) + hitSlop * 2;
      
      // Guarda para debug
      rec.hitW = hitW;
      rec.hitH = hitH;
      
      // Apply letterboxing compensation to screen coordinates
      sx += offX;
      sy += offY;

      // Cachear posición de pantalla final (evita getBoundingClientRect en snap handler)
      rec._screenX = sx;
      rec._screenY = sy;

      // Aplicar estilos al wrap
      rec.wrap.style.width = `${visualW}px`;
      rec.wrap.style.height = `${visualH}px`;
      rec.wrap.style.transform = `translate(${sx}px, ${sy}px) translate(-50%,-50%) rotate(${rec.rotationDeg}deg)`;
      rec.wrap.style.zIndex = Math.round(1000 + (rec.z * 100) + (rec.worldY / 1000));
      
      // Nuevo flag solo para overlays DOM
      const overlayDebug = GLOBAL_CONFIG.DEBUG_OVERLAY_WRAPS === true;

      if (overlayDebug) {
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

  _onPointerDown(ev) {
    const wrap = ev.currentTarget;
    const key = wrap?.dataset?.key;
    if (!key) return;
    const rec = this.items.get(key);
    if (!rec) return;
    rec._pd = { x: ev.clientX, y: ev.clientY, t: performance.now() };
  }

  _onPointerUp(ev) {
    const wrap = ev.currentTarget;
    const key = wrap?.dataset?.key;
    if (!key) return;
    const rec = this.items.get(key);
    if (!rec || !rec._pd) return;
    const dx = Math.abs(ev.clientX - rec._pd.x);
    const dy = Math.abs(ev.clientY - rec._pd.y);
    const dt = performance.now() - rec._pd.t;

    // 🆕 "fat-finger forgiveness": solo click si no se arrastró
    if (dx <= 8 && dy <= 8 && dt <= 500) {
      // 🆕 Verifica toggle global antes de cualquier acción
      if (!GLOBAL_CONFIG.SHOW_POPUP_ON_CLICK) {
        console.log(`[INFO] Popup disabled via SHOW_POPUP_ON_CLICK for hotspot ${key}`);
        return;  // Sale temprano si popups están desactivados
      }

      // 🆕 Hotspot informativo — no abre popup
      if (rec.meta?.noPopup) return;

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
