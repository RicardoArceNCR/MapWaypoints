// OverlayLayer.js
// Capa screen-space para overlays DOM con ancho fijo en px y rotación.
// Útil para hotspots clicables, rótulos, stickers que deben verse nítidos
// sin importar el zoom del canvas.

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
    if (!rec || !rec.hitW || !rec.hitH) return;
    
    if (rec._lastHitW !== rec.hitW || rec._lastHitH !== rec.hitH) {
      console.log(
        `🎯 Hitbox [${rec.wrap?.dataset?.key || '?'}]:`,
        `${~~rec.hitW}×${~~rec.hitH}px`,
        `(shape: ${rec.meta?.shape || 'rect'})`,
        `@ (${~~rec.worldX}, ${~~rec.worldY})`
      );
      rec._lastHitW = rec.hitW;
      rec._lastHitH = rec.hitH;
    }
  }

  /**
   * Paints the final position/rotation/order of "live" frame items.
   * Performs cheap culling and avoids unnecessary reflow.
   */
  endFrame(camera, canvasW, canvasH) {
    const vw = this.lastDims.w || canvasW;
    const vh = this.lastDims.h || canvasH;

    for (const [key, rec] of this.items) {
      const alive = this.frameLiveKeys.has(String(key));
      if (!alive) {
        rec.wrap.removeEventListener('pointerdown', this._onPointerDown);
        rec.wrap.removeEventListener('pointerup', this._onPointerUp);
        rec.wrap.remove();
        this.items.delete(key);
        continue;
      }

      // world → screen
      const sx = (rec.worldX - camera.x) * camera.z + (canvasW / 2);
      const sy = (rec.worldY - camera.y) * camera.z + (canvasH / 2);

      // culling
      if (sx < -500 || sy < -500 || sx > vw + 500 || sy > vh + 500) {
        rec.wrap.style.display = 'none';
        continue;
      } else {
        rec.wrap.style.display = 'block';
      }

      // 🆕 hitbox: control preciso de dimensiones
      const visualW = rec.lockWidthPx;
      const visualH = Number(rec.meta?.visualH || visualW);
      const hitSlop = Number(rec.meta?.hitSlop || window.GLOBAL_CONFIG?.TOUCH?.hitSlop || 0);
      
      // 🎯 Modo compacto: usa tamaño visual exacto
      const compact = !!rec.meta?.compact;
      const minTap = compact ? 0 : Number(rec.meta?.minTap || 
        (this.device === 'mobile' ? 
          (window.GLOBAL_CONFIG?.TOUCH?.mobileMin || 56) : 
          (window.GLOBAL_CONFIG?.TOUCH?.desktopMin || 40)));

      // Calcula hitbox respetando modo compacto
      const hitW = (compact ? visualW : Math.max(visualW, minTap)) + hitSlop * 2;
      const hitH = (compact ? visualH : Math.max(visualH, minTap)) + hitSlop * 2;
      
      // Guarda para debug
      rec.hitW = hitW;
      rec.hitH = hitH;
      
      // 🆕 Estilos de depuración condicionales
      if (window.GLOBAL_CONFIG?.DEBUG_HOTSPOTS) {
        const style = window.GLOBAL_CONFIG.ICON_STYLES || {};
        rec.wrap.style.border = `${style.borderWidth || 1.5}px solid ${style.borderColor || 'rgba(255,255,255,0.55)'}`;
        rec.wrap.style.background = style.debugFill || 'rgba(255,0,0,0.12)';
        rec.wrap.style.borderRadius = (rec.meta?.shape === 'circle') ? '50%' : '8px';
        rec.wrap.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
        
        // Log de depuración
        if (window.GLOBAL_CONFIG.DEBUG_HOTSPOTS) {
          this._debugLog(rec);
        }
      } else {
        rec.wrap.style.border = 'none';
        rec.wrap.style.background = 'transparent';
        rec.wrap.style.boxShadow = 'none';
        rec.wrap.style.borderRadius = (rec.meta?.shape === 'circle') ? '50%' : '0';
      }

      const ws = rec.wrap.style;
      if (ws.width  !== `${hitW}px`)  ws.width  = `${hitW}px`;
      if (ws.height !== `${hitH}px`)  ws.height = `${hitH}px`;
      if (ws.left   !== `${sx}px`)    ws.left   = `${sx}px`;
      if (ws.top    !== `${sy}px`)    ws.top    = `${sy}px`;
      if (ws.zIndex !== String(100 + (rec.z|0))) ws.zIndex = String(100 + (rec.z|0));

      // 🔍 Debug: log si el hitbox cambió
      if (window.GLOBAL_CONFIG?.DEBUG_HOTSPOTS) {
        this._debugLog(rec);
      }

      // borde redondo para shape circle, esquinas suaves para rect
      const shape = rec.meta?.shape === 'circle' ? '50%' : '8px';
      if (ws.borderRadius !== shape) ws.borderRadius = shape;

      // centrar + rotar
      const transform = `translate(-50%,-50%) rotate(${rec.rotationDeg}deg)`;
      if (ws.transform !== transform) {
        ws.transform = transform;
        if (ws.transformOrigin !== '50% 50%') ws.transformOrigin = '50% 50%';
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
    rec._pd = { x: ev.clientX, y: ev.clientY, t: performance.now() };
  }

  _onPointerUp(ev) {
    const wrap = ev.currentTarget;
    const key = wrap?.dataset?.key;
    if (!key) return;
    const rec = this.items.get(key);
    const dx = Math.abs(ev.clientX - rec._pd.x);
    const dy = Math.abs(ev.clientY - rec._pd.y);
    const dt = performance.now() - rec._pd.t;

    // 🆕 “fat-finger forgiveness”: solo click si no se arrastró
    if (dx <= 8 && dy <= 8 && dt <= 500) {
      this.root.dispatchEvent(new CustomEvent('overlay:click', {
        bubbles: true,
        detail: { key, record: rec }
      }));
    }
  }
}
