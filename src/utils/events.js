/**
 * Unified coordinate conversion utilities
 * Ensures consistent coordinate transformation between screen and world space
 */

/**
 * Converts client coordinates to map coordinates using the provided fitRect
 * @param {MouseEvent|TouchEvent|{clientX: number, clientY: number}} e - The event or position object
 * @param {HTMLCanvasElement} canvas - The canvas element
 * @param {Object} fitRect - The fit rectangle {x, y, scale}
 * @returns {{mx: number, my: number, cx: number, cy: number}} Map and client coordinates
 */
export function clientToMapCoords(e, canvas, fitRect) {
  // Extract client coordinates from event
  const clientX = e.clientX ?? e.touches?.[0]?.clientX;
  const clientY = e.clientY ?? e.touches?.[0]?.clientY;
  
  if (clientX === undefined || clientY === undefined) {
    console.warn('Could not extract coordinates from event', e);
    return { mx: 0, my: 0, cx: 0, cy: 0 };
  }
  
  // Get canvas bounds
  const rect = canvas.getBoundingClientRect();
  
  // Convert to canvas coordinates
  const cx = clientX - rect.left;
  const cy = clientY - rect.top;
  
  // If we have a fitRect, use it for more accurate conversion
  if (fitRect && fitRect.x !== undefined && fitRect.y !== undefined && fitRect.scale) {
    return {
      mx: (cx - fitRect.x) / fitRect.scale,
      my: (cy - fitRect.y) / fitRect.scale,
      cx,
      cy
    };
  }
  
  // Fallback to camera-based conversion (less accurate)
  const dpr = Math.min(window.DPR_MAX || 2, window.devicePixelRatio || 1);
  const canvasLogicalW = canvas.width / dpr;
  const canvasLogicalH = canvas.height / dpr;
  
  const px = (cx / rect.width) * canvasLogicalW;
  const py = (cy / rect.height) * canvasLogicalH;
  
  return {
    mx: (px - canvasLogicalW/2) / (window.camera?.z || 1) + (window.camera?.x || 0),
    my: (py - canvasLogicalH/2) / (window.camera?.z || 1) + (window.camera?.y || 0),
    cx,
    cy
  };
}

/**
 * Gets the position of a click/touch event in map coordinates
 * @param {Event} e - The event
 * @param {HTMLCanvasElement} canvas - The canvas element
 * @param {Object} [fitRect] - Optional fit rectangle {x, y, scale}
 * @returns {{x: number, y: number}} The map coordinates
 */
export function getEventMapPosition(e, canvas, fitRect) {
  const { mx, my } = clientToMapCoords(e, canvas, fitRect);
  return { x: mx, y: my };
}

/**
 * Checks if a point is within a rectangle
 * @param {number} x - Point X
 * @param {number} y - Point Y
 * @param {number} rectX - Rectangle X
 * @param {number} rectY - Rectangle Y
 * @param {number} width - Rectangle width
 * @param {number} height - Rectangle height
 * @returns {boolean} True if the point is inside the rectangle
 */
export function isPointInRect(x, y, rectX, rectY, width, height) {
  return x >= rectX && x <= rectX + width && y >= rectY && y <= rectY + height;
}
