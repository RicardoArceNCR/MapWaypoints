// OverlayLayer.js
// Capa screen-space para elementos con ancho fijo en px y rotación.
// Mantiene interacciones y culling eficiente.

export class OverlayLayer {
  constructor(rootEl) {
    this.root = rootEl;                             // <div id="overlay-layer">
    this.items = new Map();                         // key -> dom + state
    this.frameLiveKeys = new Set();                 // compactado por frame
    this.lastDims = { w: 0, h: 0 };
    this.device = 'mobile';
    this._onClick = this._onClick.bind(this);
  }

  resize(w, h) { this.lastDims = { w, h }; }

  setDevice(device) { this.device = device; }       // 'mobile' | 'desktop'

  beginFrame() {
    this.frameLiveKeys.clear();
  }

  /**
   * Upsert de un item de overlay.
   * @param {Object} opt
   *  - key: id único (string|number)
   *  - src: ruta de la imagen
   *  - worldX, worldY: coordenadas en "mundo" (mismo origen que tu canvas)
   *  - rotationDeg: rotación en grados (mismo signo que en canvas)
   *  - lockWidthPx: ancho fijo en px de pantalla
   *  - z: (opcional) orden visual
   *  - meta: objeto con info del hotspot para popup/drawer
   */
  upsert(opt) {
    const {
      key, src, worldX, worldY, rotationDeg = 0,
      lockWidthPx = 420, z = 0, meta = {}
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

  /**
   * Convierte coordenadas world → screen (px DOM).
   * Debes pasar el estado de cámara y el tamaño lógico del canvas (px DOM).
   */
  worldToScreen(x, y, camera, canvasW, canvasH) {
    const sx = (x - camera.x) * camera.z + (canvasW / 2);
    const sy = (y - camera.y) * camera.z + (canvasH / 2);
    return { x: sx, y: sy };
  }

  /**
   * Aplica posición/rotación/escala final de todos los items vivos.
   */
  endFrame(camera, canvasW, canvasH) {
    // Culling y actualización por transform (sin layout thrash)
    const vw = this.lastDims.w || canvasW;
    const vh = this.lastDims.h || canvasH;

    for (const [key, rec] of this.items) {
      const alive = this.frameLiveKeys.has(String(key));
      if (!alive) {
        // Remueve los que no fueron “tocados” este frame
        rec.el.removeEventListener('click', this._onClick);
        rec.el.remove();
        this.items.delete(key);
        continue;
      }

      // world → screen
      const { x, y } = this.worldToScreen(rec.worldX, rec.worldY, camera, canvasW, canvasH);

      // Culling: si queda muy fuera, lo ocultamos (no destruimos)
      const offscreen = (x < -500 || y < -500 || x > vw + 500 || y > vh + 500);
      rec.el.style.display = offscreen ? 'none' : 'block';
      if (offscreen) continue;

      // Layout: ancho fijo px; alto por proporción natural
      // (deja al navegador calcular altura)
      if (rec.el.style.width !== `${rec.lockWidthPx}px`)
