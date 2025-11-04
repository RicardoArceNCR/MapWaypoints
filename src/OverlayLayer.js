// OverlayLayer.js
// Capa screen-space para overlays DOM con ancho fijo en px y rotación.
// Útil para hotspots clicables, rótulos, stickers que deben verse nítidos
// sin importar el zoom del canvas.

export class OverlayLayer {
  constructor(rootEl) {
    this.root = rootEl;                 // <div id="overlay-layer">
    this.items = new Map();             // key -> { el, meta, worldX, worldY, ... }
    this.frameLiveKeys = new Set();     // compactación por frame
    this.lastDims = { w: 0, h: 0 };
    this.device = 'mobile';

    this._onClick = this._onClick.bind(this);
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
      rotationDeg = 0, lockWidthPx = 420,
      z = 0, meta = {}
    } = opt;

    let rec = this.items.get(key);
    if (!rec) {
      const el = document.createElement('img');
      el.className = 'overlay-item';
      el.draggable = false;
      el.decoding = 'async';
      el.loading = 'lazy';
      el.alt = meta?.title || '';
      el.src = src;

      el.dataset.key = String(key);
      el.addEventListener('click', this._onClick);

      rec = { el, meta, lockWidthPx, worldX, worldY, rotationDeg, z };
      this.items.set(key, rec);
      this.root.appendChild(el);
    }

    // Actualiza state mínimo
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
   * Pinta posición/rotación/orden final de los items "vivos" del frame.
   * Hace culling barato y evita reflujo innecesario.
   */
  endFrame(camera, canvasW, canvasH) {
    const vw = this.lastDims.w || canvasW;
    const vh = this.lastDims.h || canvasH;

    for (const [key, rec] of this.items) {
      const alive = this.frameLiveKeys.has(String(key));
      if (!alive) {
        rec.el.removeEventListener('click', this._onClick);
        rec.el.remove();
        this.items.delete(key);
        continue;
      }

      // world → screen
      const { x, y } = this.worldToScreen(rec.worldX, rec.worldY, camera, canvasW, canvasH);

      // Culling: si queda muy fuera, oculta (no destruye)
      const off = (x < -500 || y < -500 || x > vw + 500 || y > vh + 500);
      if (off) {
        if (rec.el.style.display !== 'none') rec.el.style.display = 'none';
        continue;
      } else if (rec.el.style.display !== 'block') {
        rec.el.style.display = 'block';
      }

      // Layout: ancho fijo (px). Deja al navegador calcular el alto natural.
      const targetW = `${rec.lockWidthPx}px`;
      if (rec.el.style.width !== targetW) {
        rec.el.style.width = targetW;
        rec.el.style.height = 'auto';
      }

      // Posición absoluta + transform para centrar y rotar
      const style = rec.el.style;
      if (style.position !== 'absolute') style.position = 'absolute';

      // Evita escribir lo mismo en cada frame
      const left = `${x}px`;
      const top = `${y}px`;
      if (style.left !== left) style.left = left;
      if (style.top !== top) style.top = top;

      const zIndex = String(100 + (rec.z | 0));
      if (style.zIndex !== zIndex) style.zIndex = zIndex;

      const transform = `translate(-50%,-50%) rotate(${rec.rotationDeg}deg)`;
      if (style.transform !== transform) {
        style.transform = transform;
        if (style.transformOrigin !== '50% 50%') style.transformOrigin = '50% 50%';
      }
    }
  }

  _onClick(evt) {
    const key = evt.currentTarget?.dataset?.key;
    if (!key) return;
    // Reemite un CustomEvent para que la UI lo escuche en un solo sitio
    this.root.dispatchEvent(new CustomEvent('overlay:click', {
      bubbles: true,
      detail: {
        key,
        record: this.items.get(key) || null
      }
    }));
  }
}
