/**
 * Computes the rectangle and scale needed to fit content within a container
 * using either 'contain' or 'cover' mode, similar to CSS's object-fit.
 * 
 * @param {number} cssW - Container width in CSS pixels
 * @param {number} cssH - Container height in CSS pixels
 * @param {number} baseW - Content's logical width
 * @param {number} baseH - Content's logical height
 * @param {'contain'|'cover'} [mode='contain'] - Fit mode: 'contain' (default) or 'cover'
 * @returns {{x: number, y: number, w: number, h: number, scale: number}} - Position and dimensions of the fitted rectangle
 */
export function computeFitRect(cssW, cssH, baseW, baseH, mode = 'contain') {
  // Calculate scale factors for both contain and cover modes
  const scaleContain = Math.min(cssW / baseW, cssH / baseH);
  const scaleCover = Math.max(cssW / baseW, cssH / baseH);
  
  // Use the appropriate scale based on mode
  const scale = mode === 'cover' ? scaleCover : scaleContain;
  
  // Calculate dimensions and position
  const w = baseW * scale;
  const h = baseH * scale;
  const x = (cssW - w) / 2;  // Center horizontally
  const y = (cssH - h) / 2;  // Center vertically

  return { x, y, w, h, scale };
}

/**
 * Determines if a point (in container coordinates) is within the fitted rectangle.
 * Useful for hit testing.
 * 
 * @param {number} x - X coordinate in container space
 * @param {number} y - Y coordinate in container space
 * @param {Object} rect - The rectangle returned by computeFitRect
 * @returns {boolean} - True if the point is within the rectangle
 */
export function isPointInFittedRect(x, y, rect) {
  return x >= rect.x && 
         x <= rect.x + rect.w && 
         y >= rect.y && 
         y <= rect.y + rect.h;
}

/**
 * Converts container coordinates to content coordinates using the fitted rectangle.
 * 
 * @param {number} x - X coordinate in container space
 * @param {number} y - Y coordinate in container space
 * @param {Object} rect - The rectangle returned by computeFitRect
 * @returns {{x: number, y: number}} - Coordinates in content space
 */
export function containerToContent(x, y, rect) {
  return {
    x: (x - rect.x) / rect.scale,
    y: (y - rect.y) / rect.scale
  };
}

/**
 * Converts content coordinates to container coordinates using the fitted rectangle.
 * 
 * @param {number} x - X coordinate in content space
 * @param {number} y - Y coordinate in content space
 * @param {Object} rect - The rectangle returned by computeFitRect
 * @returns {{x: number, y: number}} - Coordinates in container space
 */
export function contentToContainer(x, y, rect) {
  return {
    x: x * rect.scale + rect.x,
    y: y * rect.scale + rect.y
  };
}
