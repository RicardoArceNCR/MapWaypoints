// Camera.js - Clase para manejar transformaciones world ↔ screen/CSS
export class Camera {
  constructor(initial = { x: 0, y: 0, z: 1, viewportW: 1280, viewportH: 720 }) {
    this.x = initial.x;  // Centro world X
    this.y = initial.y;  // Centro world Y
    this.z = initial.z;  // Zoom (scale)
    this.viewportW = initial.viewportW;  // CSS width (no DPR)
    this.viewportH = initial.viewportH;  // CSS height (no DPR)
    this.rotation = 0;   // Futuro: rotación global (por ahora 0)
    this.M = null;       // Matriz world-to-css
    this.Minv = null;    // Inversa css-to-world
    this.dirty = true;   // Flag para re-cálculo
    this.baseW = 0;      // Ancho base del arte
    this.baseH = 0;      // Alto base del arte
  }

  // Actualiza viewport (llamado en resize)
  setViewport(w, h) {
    if (this.viewportW === w && this.viewportH === h) return;
    this.viewportW = w;
    this.viewportH = h;
    this.dirty = true;
  }

  // Establece el tamaño base del arte (px del archivo base)
  setBaseSize(baseW, baseH) {
    this.baseW = baseW;
    this.baseH = baseH;
  }

  // Actualiza posición/zoom (llamado en transiciones)
  setPosition(x, y, z) {
    if (this.x === x && this.y === y && this.z === z) return;
    this.x = x;
    this.y = y;
    this.z = z;
    this.dirty = true;
  }

  // Calcula matrices si dirty (pre-cálculo eficiente)
  updateMatrices() {
    if (!this.dirty) return;
    
    // Matriz simple: translate to center + scale (zoom) + translate viewport/2
    // M = [z, 0, viewportW/2 - x*z,  0, z, viewportH/2 - y*z,  0, 0, 1]
    // Para simplicidad, usamos affine (sin full matrix lib)
    this.M = {
      scale: this.z,
      tx: this.viewportW / 2 - this.x * this.z,
      ty: this.viewportH / 2 - this.y * this.z
    };
    
    // Inversa aproximada (para css-to-world)
    this.Minv = {
      scale: 1 / this.z,
      tx: (this.x * this.z - this.viewportW / 2) / this.z,
      ty: (this.y * this.z - this.viewportH / 2) / this.z
    };
    
    this.dirty = false;
  }

  // World to CSS (para overlays y dibujo canvas sin DPR)
  worldToCss(wx, wy) {
    this.updateMatrices();
    const cx = this.viewportW * 0.5;
    const cy = this.viewportH * 0.5;
    return {
      x: cx + (wx - this.x) * this.z,
      y: cy + (wy - this.y) * this.z
    };
  }

  // CSS to World (para input, e.g., clics)
  cssToWorld(px, py) {
    this.updateMatrices();
    const cx = this.viewportW * 0.5;
    const cy = this.viewportH * 0.5;
    return {
      x: this.x + (px - cx) / this.z,
      y: this.y + (py - cy) / this.z
    };
  }

  // Bounds del viewport en world space (para culling)
  getWorldBounds() {
    this.updateMatrices();
    const halfW = this.viewportW / (2 * this.z);
    const halfH = this.viewportH / (2 * this.z);
    return {
      minX: this.x - halfW,
      maxX: this.x + halfW,
      minY: this.y - halfH,
      maxY: this.y + halfH
    };
  }

  // Ajusta posición/zoom para que un rectángulo base (mapa) quepa en el viewport
  // mode: 'contain' (recomendado) o 'cover'
  fitBaseToViewport(baseW, baseH, mode = 'contain') {
    this.setBaseSize(baseW, baseH);
    const sx = this.viewportW / baseW;
    const sy = this.viewportH / baseH;
    const s = (mode === 'cover') ? Math.max(sx, sy) : Math.min(sx, sy);
    
    // Centra al medio del arte
    this.x = baseW * 0.5;
    this.y = baseH * 0.5;
    this.z = s;
    this.dirty = true;
  }
}
