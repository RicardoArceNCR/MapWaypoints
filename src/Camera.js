// Camera.js - Clase para manejar transformaciones world ↔ screen/CSS
export class Camera {
  constructor(initial = { x: 0, y: 0, z: 1, viewportW: 1280, viewportH: 720, worldW: 0, worldH: 0 }) {
    this.x = initial.x;  // Centro world X
    this.y = initial.y;  // Centro world Y
    this.z = initial.z;  // Zoom (scale)
    this.viewportW = initial.viewportW;  // CSS width (no DPR)
    this.viewportH = initial.viewportH;  // CSS height (no DPR)
    this.worldW = initial.worldW || 0;   // Ancho del mundo (mapa)
    this.worldH = initial.worldH || 0;   // Alto del mundo (mapa)
    this.rotation = 0;   // Futuro: rotación global (por ahora 0)
    this.M = null;       // Matriz world-to-css
    this.Minv = null;    // Inversa css-to-world
    this.dirty = true;   // Flag para re-cálculo
    this.effectiveScale = 1; // Escala efectiva después de aplicar fillMode
    this.offsetX = 0;    // Offset X para centrado
    this.offsetY = 0;    // Offset Y para centrado
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

  // Actualiza dimensiones del mundo (llamado en carga de mapa)
  setWorldDims(w, h) {
    if (this.worldW === w && this.worldH === h) return;
    this.worldW = w;
    this.worldH = h;
    this.dirty = true;
  }

  // Actualiza matrices si dirty (pre-cálculo eficiente)
  updateMatrices() {
    if (!this.dirty) return;
    
    let effectiveScale = this.z;
    let offsetX = 0;
    let offsetY = 0;
    
    // Obtener el modo de llenado de la configuración global
    const fillMode = window.GLOBAL_CONFIG?.CAMERA?.fillMode || 'none';
    
    // Aplicar fillMode solo si tenemos dimensiones del mundo
    if (fillMode !== 'none' && this.worldW > 0 && this.worldH > 0) {
      const viewportAspect = this.viewportW / this.viewportH;
      const worldAspect = this.worldW / this.worldH;
      
      if (fillMode === 'contain') {
        // Escalar para que todo el mundo sea visible (sin recorte)
        const scaleX = this.viewportW / this.worldW;
        const scaleY = this.viewportH / this.worldH;
        effectiveScale *= Math.min(scaleX, scaleY);
        
        // Centrar en el viewport
        const scaledWorldW = this.worldW * effectiveScale;
        const scaledWorldH = this.worldH * effectiveScale;
        offsetX = (this.viewportW - scaledWorldW) / 2;
        offsetY = (this.viewportH - scaledWorldH) / 2;
      } 
      else if (fillMode === 'cover') {
        // Escalar para llenar todo el viewport (con recorte)
        const scaleX = this.viewportW / this.worldW;
        const scaleY = this.viewportH / this.worldH;
        effectiveScale *= Math.max(scaleX, scaleY);
        
        // Centrar en el viewport
        const scaledWorldW = this.worldW * effectiveScale;
        const scaledWorldH = this.worldH * effectiveScale;
        offsetX = (this.viewportW - scaledWorldW) / 2;
        offsetY = (this.viewportH - scaledWorldH) / 2;
      }
      
      // Centrar la cámara en el mundo si no está configurada
      if (this.x === 0 && this.y === 0) {
        this.x = this.worldW / 2;
        this.y = this.worldH / 2;
      }
    }
    
    this.effectiveScale = effectiveScale;
    this.offsetX = offsetX;
    this.offsetY = offsetY;
    
    // Matriz de transformación world-to-css
    this.M = {
      scale: effectiveScale,
      tx: this.viewportW / 2 - this.x * effectiveScale + offsetX,
      ty: this.viewportH / 2 - this.y * effectiveScale + offsetY
    };
    
    // Matriz inversa (css-to-world)
    this.Minv = {
      scale: 1 / effectiveScale,
      tx: (this.x * effectiveScale - this.viewportW / 2 - offsetX) / effectiveScale,
      ty: (this.y * effectiveScale - this.viewportH / 2 - offsetY) / effectiveScale
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
}
