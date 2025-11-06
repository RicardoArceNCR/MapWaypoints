/**
 * Debug utilities for map and overlay validation
 */

/**
 * Validates world-to-screen coordinate conversion round trip
 * @param {Object} waypoint - The waypoint to test
 * @param {Camera} camera - Camera instance
 * @param {Object} fitRect - Fit rectangle for coordinate conversion
 * @returns {Object} Round trip error in pixels
 */
export function validateCoordinateRoundTrip(waypoint, camera, fitRect) {
  if (!waypoint || !camera || !fitRect) {
    console.warn('Missing parameters for coordinate validation');
    return { x: 0, y: 0 };
  }

  const p = { x: waypoint.x, y: waypoint.y };
  const s = camera.worldToCss(p.x, p.y, fitRect);
  const w = camera.cssToWorld(s.x, s.y, fitRect);
  
  const error = {
    x: Math.abs(w.x - p.x),
    y: Math.abs(w.y - p.y),
    distance: Math.hypot(w.x - p.x, w.y - p.y)
  };
  
  console.log('[Debug] Coordinate round-trip validation:', {
    original: p,
    screen: s,
    roundTrip: w,
    error,
    message: `Error: ${error.distance.toFixed(2)}px (x: ${error.x.toFixed(2)}, y: ${error.y.toFixed(2)})`
  });
  
  return error;
}

/**
 * Draws a debug grid on the canvas
 * @param {CanvasRenderingContext2D} ctx - Canvas 2D context
 * @param {Camera} camera - Camera instance
 * @param {Object} canvasSize - { width, height } of the canvas
 * @param {Object} fitRect - Fit rectangle for coordinate conversion
 * @param {Object} [options] - Grid options
 * @param {number} [options.spacing=100] - Grid spacing in world units
 * @param {string} [options.color='rgba(255, 0, 0, 0.3)'] - Grid line color
 */
export function drawDebugGrid(ctx, camera, canvasSize, fitRect, options = {}) {
  const {
    spacing = 100,
    color = 'rgba(255, 0, 0, 0.3)'
  } = options;

  const { width, height } = canvasSize;
  const { x: camX, y: camY, z: zoom } = camera;
  
  // Calculate visible bounds in world coordinates
  const halfW = (width / 2) / zoom;
  const halfH = (height / 2) / zoom;
  
  const minX = Math.floor((camX - halfW) / spacing) * spacing;
  const maxX = Math.ceil((camX + halfW) / spacing) * spacing;
  const minY = Math.floor((camY - halfH) / spacing) * spacing;
  const maxY = Math.ceil((camY + halfH) / spacing) * spacing;
  
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1 / zoom;
  ctx.beginPath();
  
  // Draw vertical lines
  for (let x = minX; x <= maxX; x += spacing) {
    const start = camera.worldToCss(x, minY, fitRect);
    const end = camera.worldToCss(x, maxY, fitRect);
    
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    
    // Add coordinate labels at the top of the screen
    if (start.y < 30) {
      ctx.save();
      ctx.font = `${12 / zoom}px Arial`;
      ctx.fillStyle = 'red';
      ctx.fillText(x, start.x, 15);
      ctx.restore();
    }
  }
  
  // Draw horizontal lines
  for (let y = minY; y <= maxY; y += spacing) {
    const start = camera.worldToCss(minX, y, fitRect);
    const end = camera.worldToCss(maxX, y, fitRect);
    
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    
    // Add coordinate labels at the left of the screen
    if (start.x < 60) {
      ctx.save();
      ctx.font = `${12 / zoom}px Arial`;
      ctx.fillStyle = 'red';
      ctx.textAlign = 'right';
      ctx.fillText(y, 50, start.y + 4);
      ctx.restore();
    }
  }
  
  ctx.stroke();
  ctx.restore();
  
  return { minX, maxX, minY, maxY };
}

/**
 * Adds debug overlay markers at specific world coordinates
 * @param {OverlayLayer} overlayLayer - The overlay layer instance
 * @param {Array} points - Array of {x, y} points in world coordinates
 * @param {string} [color='red'] - Color of the markers
 * @param {number} [size=10] - Size of the markers in pixels
 */
export function addDebugMarkers(overlayLayer, points = [], color = 'red', size = 10) {
  points.forEach((point, i) => {
    overlayLayer.upsert({
      key: `debug-${i}`,
      worldX: point.x,
      worldY: point.y,
      lockWidthPx: size,
      meta: {
        shape: 'circle',
        style: {
          background: color,
          borderRadius: '50%',
          border: `1px solid white`,
          boxShadow: '0 0 0 1px rgba(0,0,0,0.5)'
        },
        // Make sure debug markers are always on top
        zIndex: 10000 + i
      }
    });
  });
}

/**
 * Logs culling statistics
 * @param {number} totalItems - Total number of items before culling
 * @param {number} afterWorldCull - Number of items after world-space culling
 * @param {number} afterScreenCull - Number of items after screen-space culling
 */
export function logCullingStats(totalItems, afterWorldCull, afterScreenCull) {
  if (totalItems === 0) return;
  
  const worldCullPercent = ((1 - (afterWorldCull / totalItems)) * 100).toFixed(1);
  const screenCullPercent = ((1 - (afterScreenCull / afterWorldCull)) * 100).toFixed(1);
  const totalCullPercent = ((1 - (afterScreenCull / totalItems)) * 100).toFixed(1);
  
  console.groupCollapsed(`[Debug] Culling: ${afterScreenCull}/${totalItems} items visible (${totalCullPercent}% culled)`);
  console.log(`World-space culling: ${totalItems} → ${afterWorldCull} (${worldCullPercent}% culled)`);
  console.log(`Screen-space culling: ${afterWorldCull} → ${afterScreenCull} (${screenCullPercent}% culled)`);
  console.groupEnd();
}
