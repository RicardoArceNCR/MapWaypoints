/**
 * Calculates the fitting rectangle for an image within a container
 * @param {number} cssW - Container width in CSS pixels
 * @param {number} cssH - Container height in CSS pixels
 * @param {number} baseW - Original image width
 * @param {number} baseH - Original image height
 * @param {string} mode - 'contain' (default) or 'cover'
 * @returns {Object} - {x, y, w, h, s} - Position, dimensions, and scale
 */
export function computeFitRect(cssW, cssH, baseW, baseH, mode = 'contain') {
  const scaleContain = Math.min(cssW / baseW, cssH / baseH);
  const scaleCover = Math.max(cssW / baseW, cssH / baseH);
  const s = mode === 'cover' ? scaleCover : scaleContain;
  const w = baseW * s;
  const h = baseH * s;
  const x = (cssW - w) / 2;
  const y = (cssH - h) / 2;
  return { x, y, w, h, s };
}
