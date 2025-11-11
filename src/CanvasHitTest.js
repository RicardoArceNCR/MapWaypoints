// CanvasHitTest.js - Hit testing para elementos en el canvas
// Maneja la detección de colisiones para hotspots

export class CanvasHitTest {
  constructor(camera) {
    this.camera = camera;
    this.hotspots = [];
    this.activeWaypointIndex = null;
    this.debug = false;
    this.canvas = null;
  }

  // Set hotspots with validation and logging
  setHotspots(list) {
    this.hotspots = Array.isArray(list) ? list : [];
    if (this.hotspots.length === 0) {
      console.warn('[CanvasHitTest] setHotspots received empty list. Check ingestFromConfig / waypointIndex.');
    } else if (this.debug) {
      console.log('[CanvasHitTest] active hotspots =', this.hotspots.length);
    }
  }

  // Convert normalized coordinates to world coordinates
  _normToWorld(h, mapW, mapH) {
    const nx = (h.xp != null) ? h.xp * mapW : h.x;
    const ny = (h.yp != null) ? h.yp * mapH : h.y;
    const nw = (h.wpw != null) ? h.wpw * mapW : (h.width || 36);
    const nh = (h.wph != null) ? h.wph * mapH : (h.height || 36);
    return { x: nx, y: ny, w: nw, h: nh, rotation: h.rotation || 0, id: h.id, meta: h.meta };
  }

  // Actualiza la lista de hotspots activos
  updateHotspots(hotspots, waypointIndex) {
    this.setHotspots(hotspots);
    this.activeWaypointIndex = waypointIndex;
  }

  _ensureCanvas() {
    if (!this.canvas) this.canvas = document.getElementById('mapa-canvas');
    return this.canvas;
  }

  // screen (CSS px) -> world, compensando DPR y bounding rect
  screenToWorld(screenX, screenY) {
    const canvasEl = this._ensureCanvas();
    if (!canvasEl || !this.camera) return null;
    const rect = canvasEl.getBoundingClientRect();
    // coords en CSS px relativos al canvas
    const cssX = screenX - rect.left;
    const cssY = screenY - rect.top;
    // Usa la matriz de cámara ya implementada
    return this.camera.cssToWorld(cssX, cssY);
  }

  // Convierte coordenadas de mundo a pantalla
  worldToScreen(worldX, worldY) {
    const canvasEl = this._ensureCanvas();
    if (!canvasEl) return null;
    const css = this.camera.worldToCss(worldX, worldY);
    return { x: css.x, y: css.y };
  }

  // Realiza el hit test en las coordenadas de pantalla
  hitTest(screenX, screenY) {
    const hit = this.hitAt(screenX, screenY, this.activeWaypointIndex);
    if (!hit) return null;
    
    return {
      id: hit.id,
      data: hit.data || {},
      worldX: hit.worldX ?? hit.coords?.x,
      worldY: hit.worldY ?? hit.coords?.y
    };
  }

  // Nuevo: hitAt devuelve el HOTSPOT COMPLETO (no un wrapper genérico)
  hitAt(screenX, screenY, activeWp) {
    if (!this.camera) return null;

    const worldPos = this.screenToWorld(screenX, screenY);
    if (!worldPos) return null;

    const items = (this.hotspots || []).filter(h => {
      const wpIdx = h?.meta?.waypointIndex ?? h?.waypointIndex;
      const targetWp = activeWp ?? this.activeWaypointIndex;
      return h && (targetWp == null || wpIdx === targetWp);
    });

    const hits = [];
    for (const hs of items) {
      // Get map dimensions for normalized coordinates
      const mapW = hs.meta?.mapWidth || 1000; // Default fallback
      const mapH = hs.meta?.mapHeight || 1000; // Default fallback
      
      // Convert to world coordinates using _normToWorld
      const worldCoords = this._normToWorld({
        xp: hs.xp, yp: hs.yp, x: hs.x, y: hs.y,
        wpw: hs.wpw, wph: hs.wph, width: hs.width, height: hs.height,
        rotation: hs.rotation, id: hs.id, meta: hs.meta
      }, mapW, mapH);
      
      const { x: cx, y: cy, w, h } = worldCoords;
      if (cx == null || cy == null) continue;
      
      const halfW = (w * 0.5);
      const halfH = (h * 0.5);
      const dx = worldPos.x - cx;
      const dy = worldPos.y - cy;

      const shape = hs.meta?.shape || hs.shape || 'rect';
      let hit = false;
      if (shape === 'circle') {
        const radius = Math.max(halfW, halfH);
        hit = (dx * dx + dy * dy) <= (radius * radius);
      } else {
        hit = Math.abs(dx) <= halfW && Math.abs(dy) <= halfH;
      }

      if (hit) hits.push(hs);
    }

    if (!hits.length) return null;
    // Prioriza por z/meta.size/radio si existe
    hits.sort((a,b)=>((b.meta?.z||b.z||0) - (a.meta?.z||a.z||0)));
    return hits[0];
  }

  // Obtener escala actual de la cámara
  getScale() {
    return this.camera.z || 1;
  }

  // Método para dibujar debug
  drawDebug(ctx) {
    if (!this.debug || !this.camera) return;
    
    // Guardar estado del contexto
    ctx.save();
    
    // Dibujar hitboxes
    for (const hotspot of this.hotspots) {
      if (hotspot.waypointIndex !== undefined && 
          this.activeWaypointIndex !== null && 
          hotspot.waypointIndex !== this.activeWaypointIndex) {
        continue;
      }

      // Get map dimensions for normalized coordinates
      const mapW = hotspot.meta?.mapWidth || 1000; // Default fallback
      const mapH = hotspot.meta?.mapHeight || 1000; // Default fallback
      
      // Convert to world coordinates using _normToWorld
      const worldCoords = this._normToWorld({
        xp: hotspot.xp, yp: hotspot.yp, x: hotspot.x, y: hotspot.y,
        wpw: hotspot.wpw, wph: hotspot.wph, width: hotspot.width, height: hotspot.height,
        rotation: hotspot.rotation, id: hotspot.id, meta: hotspot.meta
      }, mapW, mapH);

      const screenPos = this.worldToScreen(worldCoords.x, worldCoords.y);
      if (!screenPos) continue;

      const screenWidth = worldCoords.w * this.camera.z;
      const screenHeight = worldCoords.h * this.camera.z;

      // Dibujar hitbox
      ctx.strokeStyle = 'rgba(0, 255, 100, 0.8)';
      ctx.lineWidth = 2;
      ctx.fillStyle = 'rgba(0, 255, 100, 0.1)';
      ctx.beginPath();
      
      if (hotspot.shape === 'circle') {
        const radius = Math.max(screenWidth, screenHeight) / 2;
        ctx.arc(screenPos.x, screenPos.y, radius, 0, Math.PI * 2);
      } else {
        const halfW = screenWidth / 2;
        const halfH = screenHeight / 2;
        ctx.rect(screenPos.x - halfW, screenPos.y - halfH, screenWidth, screenHeight);
      }
      
      ctx.fill();
      ctx.stroke();
      
      // Etiqueta de debug
      if (hotspot.id) {
        ctx.fillStyle = 'white';
        ctx.font = '12px monospace';
        ctx.fillText(hotspot.id, screenPos.x + 5, screenPos.y - 5);
      }
    }
    
    ctx.restore();
  }

  // Limpiar recursos
  clear() {
    this.hotspots = [];
  }
}