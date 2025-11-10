// CanvasHitTest.js - Hit testing para elementos en el canvas
// Maneja la detección de colisiones para hotspots

export class CanvasHitTest {
  constructor(camera) {
    this.camera = camera;
    this.hotspots = [];
    this.activeWaypointIndex = null;
    this.debug = false;
  }

  // Actualiza la lista de hotspots activos
  updateHotspots(hotspots, waypointIndex) {
    this.hotspots = hotspots || [];
    this.activeWaypointIndex = waypointIndex;
  }

  // Convierte coordenadas de pantalla a mundo
  screenToWorld(screenX, screenY) {
    const canvasEl = document.getElementById('mapa-canvas');
    if (!canvasEl) return null;
    
    const rect = canvasEl.getBoundingClientRect();
    const canvasX = screenX - rect.left;
    const canvasY = screenY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const worldX = this.camera.x + (canvasX - centerX) / this.camera.z;
    const worldY = this.camera.y + (canvasY - centerY) / this.camera.z;
    
    return { x: worldX, y: worldY };
  }

  // Convierte coordenadas de mundo a pantalla
  worldToScreen(worldX, worldY) {
    const canvasEl = document.getElementById('mapa-canvas');
    if (!canvasEl) return null;
    
    const rect = canvasEl.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const screenX = centerX + (worldX - this.camera.x) * this.camera.z;
    const screenY = centerY + (worldY - this.camera.y) * this.camera.z;
    
    return { x: screenX, y: screenY };
  }

  // Realiza el hit test en las coordenadas de pantalla
  hitTest(screenX, screenY) {
    if (!this.camera) return null;

    // Convertir coordenadas de pantalla a mundo
    const worldPos = this.screenToWorld(screenX, screenY);
    if (!worldPos) return null;

    // Buscar colisiones con los hotspots
    for (const hotspot of this.hotspots) {
      // Saltar hotspots de otros waypoints
      if (hotspot.waypointIndex !== undefined && 
          this.activeWaypointIndex !== null && 
          hotspot.waypointIndex !== this.activeWaypointIndex) {
        continue;
      }

      // Verificar colisión según la forma
      const dx = worldPos.x - hotspot.worldX;
      const dy = worldPos.y - hotspot.worldY;
      const halfW = hotspot.worldWidth / 2;
      const halfH = hotspot.worldHeight / 2;
      let hit = false;

      if (hotspot.shape === 'circle') {
        // Hit test circular
        const radius = Math.max(halfW, halfH);
        hit = (dx * dx + dy * dy) <= (radius * radius);
      } else {
        // Hit test rectangular (por defecto)
        hit = Math.abs(dx) <= halfW && Math.abs(dy) <= halfH;
      }

      if (hit) {
        return {
          id: hotspot.id,
          data: hotspot.data || {},
          worldX: hotspot.worldX,
          worldY: hotspot.worldY
        };
      }
    }

    return null;
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

      const screenPos = this.worldToScreen(hotspot.worldX, hotspot.worldY);
      if (!screenPos) continue;

      const screenWidth = hotspot.worldWidth * this.camera.z;
      const screenHeight = hotspot.worldHeight * this.camera.z;

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