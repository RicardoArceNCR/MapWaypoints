// Camera.js - Clase para manejar transformaciones world ↔ screen/CSS
import { computeFitRect } from './utils/fitRect.js';

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
  }

  // Actualiza viewport (llamado en resize)
  setViewport(w, h) {
    if (this.viewportW === w && this.viewportH === h) return;
    this.viewportW = w;
    this.viewportH = h;
    this.dirty = true;
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
  worldToCss(worldX, worldY) {
    this.updateMatrices();
    return {
      x: worldX * this.M.scale + this.M.tx,
      y: worldY * this.M.scale + this.M.ty
    };
  }

  // CSS to World (para input, e.g., clics)
  cssToWorld(cssX, cssY) {
    this.updateMatrices();
    return {
      x: (cssX - this.M.tx) * this.Minv.scale,
      y: (cssY - this.M.ty) * this.Minv.scale
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

  // ✅ Ajusta posición/zoom para que un rectángulo base (mapa) quepa en el viewport
  // mode: 'contain' (recomendado) o 'cover'
  fitBaseToViewport(baseW, baseH, mode = 'contain') {
    const { x: _x, y: _y, w: _w, h: _h, s } = computeFitRect(
      this.viewportW,
      this.viewportH,
      baseW,
      baseH,
      mode
    );
    
    // Centra al medio del mapa y aplica zoom s
    const cx = baseW * 0.5;
    const cy = baseH * 0.5;
    this.setPosition(cx, cy, s);
  }
}
