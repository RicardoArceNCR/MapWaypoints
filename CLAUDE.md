# CLAUDE.md — Contexto del proyecto para asistencia con IA

> Este archivo le da contexto a Claude (u otros LLMs) sobre la arquitectura, convenciones y decisiones de diseño del proyecto. Leerlo antes de cualquier tarea.

---

## Qué es este proyecto

Aplicación web de **mapas interactivos narrativos para periodismo de investigación**. Vanilla JS + Canvas 2D + Vite. Sin frameworks de UI. Desplegado en Vercel, embebido en WordPress vía iframe.

**Stack:**
- Runtime: Vanilla JS ES modules (no React, no Vue)
- Build: Vite 6.x
- Render: Canvas 2D API + overlays DOM
- Deploy: Vercel (auto-deploy desde git push)
- Distribución: iframe en WordPress
- URL producción: `https://map-waypoints.vercel.app/`

---

## Arquitectura clave — leer antes de tocar código

### El loop de render usa dirty flags

**NUNCA** llames directamente a funciones de dibujo. Siempre usa:
```js
markDirty('camera', 'elements', 'dialog', 'minimap', 'debug')
```
El loop de `requestAnimationFrame` solo redibuja las capas marcadas. Llamar draw() directamente rompe el sistema de performance.

### El sizing del canvas es controlado por JS, no CSS

El canvas tiene `style.width/height` en px absolutos escritos por `setCanvasDPR()`. **No intentes controlar el tamaño del canvas con CSS** — los px de CSS serán sobreescritos en el próximo resize. El flujo correcto es:

```
resize → applyViewportCoverage() → setCanvasDPR() → canvas.style.*px
```

Las dimensiones actuales:
- **Ancho:** siempre `window.innerWidth`
- **Alto:** siempre `window.innerHeight`
- `--fill-scale` solo afecta el `transform: scale()` visual de `.novela.full-bleed`

### Coordenadas: tres sistemas distintos

1. **World space** — píxeles del mapa completo (ej: `logicalW=1400, logicalH=3181`). Los waypoints usan `xp/yp` normalizados (0.0–1.0) que se multiplican por estas dimensiones.
2. **CSS space** — píxeles lógicos del canvas en pantalla (sin DPR). La cámara opera aquí.
3. **Device space** — píxeles físicos (`CSS × DPR`). El bitmap del canvas opera aquí.

Para convertir entre sistemas usa la cámara:
```js
camera.worldToCss(worldX, worldY)  // world → pantalla
camera.cssToWorld(cssX, cssY)      // pantalla → world
```

### drawImage usa logicalW/H, no el tamaño natural de la imagen

```js
ctx.drawImage(mapImg, 0, 0, logicalW, logicalH);
```

La imagen se escala al espacio lógico declarado en el JSON. La resolución física de la imagen es independiente — podés entregar imágenes livianas (x1, x2) sin mover waypoints, siempre que mantengan la proporción `logicalW:logicalH`.

### Los overlays DOM viven en `OverlayLayer.js`

Los hotspots e iconos son `<div>` posicionados sobre el canvas, **no** dibujados en el canvas. Las fotos de los hotspots son `<img>` dentro de `.overlay-wrap` divs — **no están pintadas en el canvas**. Se actualizan cada frame en `overlay.endFrame(camera, canvasW, canvasH)`. Si un overlay no aparece, primero verifica que `overlay.upsert()` se esté llamando con `frameLiveKeys` correctos.

**Culling:** El culling es exclusivamente screen-space (píxeles CSS). No hay culling world-space — se eliminó por duplicado. Si un overlay está fuera del viewport en coordenadas CSS, se oculta con `display: none`. Esto es suficiente para el caso de uso actual (~20 overlays simultáneos).

**Handlers:** `_onPointerDown` y `_onPointerUp` tienen guards (`if (!rec) return`) para prevenir TypeError si un item se elimina del Map entre ambos eventos (p. ej. cambio rápido de waypoint).

### Dos objetos de cámara — CRÍTICO

Existen dos objetos de cámara en el sistema y **deben estar sincronizados cada frame**:

- `const camera = { x, y, z }` — objeto plain local en `app.js`. Recibe los offsets de breathing y lerp. Usado por el canvas para dibujar.
- `window.cameraInstance` — instancia de la clase `Camera`. Pasado a `overlay.endFrame()` para posicionar overlays DOM.

Sin sincronización, los overlays DOM quedan fijos en pantalla mientras el canvas se mueve con el breathing. El fix está en el RAF loop de `app.js`, después del bloque de lerp:

```js
// Después del bloque de breathing/lerp — sincronizar antes de endFrame()
if (window.cameraInstance) {
  window.cameraInstance.setPosition(camera.x, camera.y, camera.z);
}
```

`Camera.setPosition()` tiene early-return si los valores no cambiaron — cero costo cuando la cámara está quieta.

---

## Sistema de hotspots — dos tipos

### Tipo A — hotspot con imagen (abre popup)

Overlay DOM con foto/imagen. Click abre popup detallado. Se posiciona con `offsetX/offsetY` relativo al waypoint en world space.

```json
{
  "type": "hotspot",
  "image": "/assets/foto.webp",
  "title": "Título del popup",
  "mobile":  { "offsetX": -10, "offsetY": -200, "width": 240, "height": 140, "rotation": 3 },
  "desktop": { "offsetX": -200, "offsetY": -50,  "width": 480, "height": 280, "rotation": 2 }
}
```

### Tipo B — hotspot informativo (badge ⓘ, sin popup, sin bloqueo de clicks)

Overlay DOM invisible (`vacio.png`). No bloquea clicks al tipo A debajo. En hover sobre el badge ⓘ muestra borde dashed animado + tooltip descriptivo. Las coords deben ser **idénticas** al tipo A que etiqueta.

```json
{
  "type": "hotspot",
  "image": "/assets/vacio.png",
  "noPopup": true,
  "caption": "Descripción de lo que se ve en esta imagen.",
  "mobile":  { "offsetX": -10, "offsetY": -200, "width": 240, "height": 140, "rotation": 3 },
  "desktop": { "offsetX": -200, "offsetY": -50,  "width": 480, "height": 280, "rotation": 2 }
}
```

**Reglas del tipo B:**
- `image` siempre `/assets/vacio.png` — imagen 1×1px transparente. El sistema requiere un `src`.
- `noPopup: true` — el wrap no registra listeners de pointer. No abre popup. No consume clicks.
- `caption` — activa la creación del badge ⓘ y el tooltip en `OverlayLayer.upsert()`.
- Coords **idénticas** al tipo A — mismo `offsetX/Y`, `width`, `height`, `rotation`.
- El hover se activa **solo al pasar sobre el badge ⓘ** (22px en esquina), no sobre toda el área.
- En mobile (`@media (hover: none)`) el tooltip y el borde dashed se desactivan automáticamente.
- El par A+B va en el mismo array del waypoint en `icons.json`, A primero.

**Cómo funciona internamente:**
- `upsert()`: si `meta.noPopup === true`, no se agregan listeners `pointerdown/pointerup`.
- `upsert()`: si `meta.caption` existe, se inyecta `.hs-caption` (badge + tooltip) como hijo del wrap.
- CSS: `.overlay-wrap.has-caption` tiene `pointer-events: none`. Solo `.hs-caption__badge` tiene `pointer-events: auto`.
- CSS: el hover usa `:has(.hs-caption__badge:hover)` para activar borde dashed y tooltip — cero JS.
- CSS: `hs-dash-march` (@keyframes) solo corre cuando el cursor está sobre el badge — no consume GPU en reposo.

---

## Archivos más importantes

| Archivo | Qué hace | Cuándo tocarlo |
|---|---|---|
| `src/app.js` | Boot, loop RAF, resize, dirty flags, intro screen, sync camera | Layout, viewport, resize bugs, intro, breathing |
| `src/config.js` | `GLOBAL_CONFIG` — todos los parámetros técnicos | Ajustar límites, timeouts, breakpoints |
| `src/MapManager.js` | Carga story.json, mapas, imágenes, caché | Agregar campos a JSON, cambiar rutas |
| `src/Camera.js` | Zoom, pan, transiciones, breathing | Comportamiento de cámara |
| `src/OverlayLayer.js` | Overlays DOM, culling, hit testing, caption badge | Posicionamiento de hotspots tipos A y B |
| `src/UIManager.js` | Fases, drawer, progreso, selector | UI chrome (no canvas) |
| `src/DetailedPopupManager.js` | Popups modales con personas/fechas/hechos | Cambios en la UI de popups |
| `src/editor.js` | Editor visual — solo carga con `?editor=1` | Herramienta de desarrollo |
| `src/style.css` | Layout, overlays, `.hs-caption`, `.has-caption`, `hs-dash-march` | Estilos visuales, badge ⓘ |
| `src/popup_styles.css` | Estilos de popups detallados | Estilos de popups |
| `public/assets/vacio.png` | Imagen 1×1px transparente para hotspots tipo B | No tocar |
| `public/data/story.json` | Historia default (fallback sin `?story=`) | Datos de prueba |
| `public/data/stories/*/story.json` | Historias reales — incluye campo `intro` opcional | Contenido editorial |
| `public/data/index.json` | Catálogo de todas las historias | Registrar nueva historia |

---

## Pantalla de introducción (Intro Screen)

Sistema de presentación que se muestra antes del mapa al cargar una historia. Es un overlay DOM (`position: fixed; z-index: 200`) encima de todo. El mapa se carga en paralelo mientras el usuario ve el intro — sin impacto en performance.

### Activación

Se activa automáticamente si el `story.json` de la historia tiene el campo `intro`:

```json
{
  "intro": {
    "title": "ASÍ ASESINARON A\nROBERTO SAMCAM:",
    "subtitle": "UN CRIMEN EN TRES FASES"
  }
}
```

Si el campo `intro` no existe, la pantalla no aparece. Es completamente opcional por historia.

### Secuencia de animación

| Orden | Elemento | Momento |
|---|---|---|
| 1 | Logo Divergentes | 0.3s — fade+slide CSS |
| 2 | Título (typewriter JS) | 1.6s — letra por letra |
| 3 | Subtítulo | al terminar título + 300ms |
| 4 | Botón "Empezar" | al terminar título + 900ms |
| 5 | Copyright footer | al terminar título + 1400ms |

### Estructura HTML (`src/index.html`)

```html
<div id="story-intro" class="story-intro" hidden aria-modal="true" role="dialog">
  <div class="story-intro__logo-wrap">
    <a href="https://www.divergentes.com/" target="_blank" rel="noopener noreferrer">
      <img src="/assets/logo-divergentes.webp" alt="Divergentes" class="story-intro__logo" />
    </a>
  </div>
  <div class="story-intro__content">
    <h1 id="intro-title"    class="story-intro__title"></h1>
    <p  id="intro-subtitle" class="story-intro__subtitle"></p>
    <button id="intro-btn"  class="story-intro__btn"><span>Empezar</span></button>
  </div>
  <p class="story-intro__copyright">© 2020 - 2026 DIVERGENTES...</p>
</div>
```

### Lógica JS (`src/app.js`)

**`showIntro({ title, subtitle })`** — puebla el DOM, activa clases `.is-visible` en los elementos en el orden correcto via `setTimeout`. El typewriter JS escribe carácter por carácter con `CHAR_DELAY = 90ms`. Respeta `\n` en el título via `white-space: pre-line`.

**`waitForIntro()`** — retorna una Promise que resuelve al click del botón "Empezar", con fade-out de 700ms antes de resolver.

```js
// Flujo en start():
await mapManager.loadStory(storyUrl);
const rawStory = mapManager._lastLoadedStory;
if (rawStory?.intro) {
  showIntro(rawStory.intro);
  const mapLoadPromise = loadMap(firstMap.id); // carga en paralelo
  await waitForIntro();
  await mapLoadPromise; // si ya cargó, instantáneo
}
```

### Clases CSS activadas por JS

| Clase | Cuándo se agrega | Efecto |
|---|---|---|
| `.is-visible` | por `showIntro()` en cada elemento | dispara `transition` de entrada |
| `.tw-done` | al terminar el typewriter | quita el cursor parpadeante |
| `.btn-ready` | 2s después del botón | activa el haz de luz giratorio |
| `.is-hiding` | al click de "Empezar" | fade-out de 700ms |

### Ocultar el header de fases durante el intro

```css
body:has(#story-intro:not([hidden])) .top-bar {
  visibility: hidden;
  pointer-events: none;
}
```

Selector CSS puro — cero JS. Se revierte automáticamente cuando el intro se oculta (`hidden`).

### Ajustar velocidad del typewriter

```js
// En showIntro() en app.js:
const CHAR_DELAY = 90;       // ms por carácter — subir = más lento
const TW_START_DELAY = 1600; // ms — espera al logo antes de empezar
```

Subtítulo, botón y copyright se recalculan automáticamente en base a `text.length * CHAR_DELAY` — nunca se desincronizan aunque cambies el texto o la velocidad.

### Performance del intro

- El `::before` del botón (haz de luz `conic-gradient` + `rotate`) corre en compositor GPU. No toca layout.
- Animaciones de entrada usan solo `opacity` + `translateY` — propiedades compositor.
- Logo y copyright usan `left:0; right:0; display:flex` para centrado — **no usar** `left:50%; transform:translateX(-50%)` porque el `translateY` de la animación lo sobreescribiría.
- El div del intro tiene `hidden` por defecto — el browser no lo renderiza hasta que `showIntro()` lo activa.

---

## Convenciones de datos

### Waypoints: `xp/yp` son normalizados (0.0–1.0)

```js
// Coordenada absoluta en world space:
const wx = waypoint.xp * mapConfig.logicalW;
const wy = waypoint.yp * mapConfig.logicalH;
```

**`logicalW/H` es la fuente de verdad.** Si cambias `logicalW/H` y la nueva imagen no mantiene la misma proporción, recalculá los `xp/yp`:
```
yp_nuevo = (yp_viejo × logicalH_viejo) / logicalH_nuevo
```

Si la imagen nueva mantiene la proporción (caso normal), los waypoints quedan intactos.

### Alineación vertical de waypoints por fila (`yOffset`)

Los waypoints de una misma fila deben apuntar al mismo `camY` en todos los perfiles. El primer waypoint de cada fila (`col1`) es la **base calibrada**. Los demás (`col2`, `col3`) compensan matemáticamente la diferencia de `yp`:

```
yOffset[p] = (camY_base - wp.mobile.yp × logicalH) × z[p]
```

donde `camY_base = col1.mobile.yp × logicalH + col1.yOffset[p] / z[p]`.

**No copiar el `yOffset` de col1 a col2/col3 directamente** — cada waypoint tiene distinto `yp` y necesita su compensación.

Para recalcular cuando cambie un `yp` o el `yOffset` de col1:

```js
const h = mapConfig.logicalH;
const base = waypoints[0]; // col1 — la base calibrada
const others = waypoints.slice(1, 3); // col2, col3

Object.keys(base.yOffset).forEach(p => {
  const z = base.zMobileProfile[p];
  const camY = base.mobile.yp * h + base.yOffset[p] / z;
  others.forEach(wp => {
    wp.yOffset[p] = Math.round((camY - wp.mobile.yp * h) * z);
  });
});
```

### Hotspot offsets: son relativos al waypoint en px del mundo

```js
// offsetX/offsetY son desplazamientos desde el waypoint en coordenadas world
const iconX = waypoint.x + icon.offsetX;
const iconY = waypoint.y + icon.offsetY;
```

No necesitan recalcularse al cambiar la imagen.

### Bundle de hotspots: icons.json

```
maps/mapa_f1_icons/icons.json   ← bundle { "wp0": [...], "wp1": [...], ... }
maps/mapa_f1_icons/wp0.json     ← fallback individual
```

`_loadSplitIcons()` intenta `icons.json` primero (1 HTTP request). Si falla, cae al loop de archivos individuales. **Al crear un nuevo mapa con hotspots, siempre crear el `icons.json` bundle.**

### Versionado de imágenes con query string

```json
"src": "/assets/mapa-mobile.webp?v=2026-05-21"
```

Cambiar la fecha fuerza al browser a no usar caché. **Siempre actualiza la versión al reemplazar una imagen.**

### Perfiles mobile por altura de dispositivo

```json
"yOffset": { "default": 0, "tablet": -80, "xtall": -220, "tall": -160, "medium": -20, "short": 30 },
"zMobileProfile": { "default": 0.8, "tablet": 0.9, "xtall": 1.1, "tall": 1.1, "medium": 0.85, "short": 0.67 }
```

Perfiles en runtime (función `getMobileHeightProfile()`):
- `tablet` → `clientWidth >= 600` (iPad Mini y similares — prioridad sobre altura)
- `short`  → `clientHeight <= 600`
- `medium` → `clientHeight <= 740` — iPhone SE (667), Samsung S8+ (740)
- `tall`   → `clientHeight <= 870` — iPhone 12 Pro (844)
- `xtall`  → `clientHeight > 870`  — iPhone XR (896), 14 Pro Max (932), Pixel 7 (915), S20 Ultra (915)

**Importante:** `zMobileProfile` tiene prioridad sobre `mobile.z`. Si el zoom no responde al editar `z`, editá `zMobileProfile` para el perfil correcto.

**Importante:** El perfil `tablet` se detecta por **ancho** (`clientWidth >= 600`), no por altura.

---

## Breakpoints y perfiles de dispositivo

```js
// Breakpoint mobile/desktop
GLOBAL_CONFIG.MOBILE_BREAKPOINT = 900  // px

// Detección en runtime
isMobileViewport()  // → true si window.innerWidth < 900

// Perfiles de altura/ancho mobile
getMobileHeightProfile()
// → 'tablet' si clientWidth  >= 600
// → 'short'  si clientHeight <= 600
// → 'medium' si clientHeight <= 740
// → 'tall'   si clientHeight <= 870
// → 'xtall'  si clientHeight >  870
```

Para debuggear qué perfil está activo:
```js
const w = document.getElementById('mapa-canvas-wrapper').clientWidth || window.innerWidth;
const h = document.getElementById('mapa-canvas-wrapper').clientHeight || window.innerHeight;
const p = w >= 600 ? 'tablet' : h <= 600 ? 'short' : h <= 740 ? 'medium' : h <= 870 ? 'tall' : 'xtall';
console.log(`w:${w} h:${h} → profile: ${p}`);
```

---

## Parámetros URL que afectan el comportamiento

```js
// Acceso via appConfig.toggles.*
appConfig.toggles.debug    // boolean — muestra grilla y labels de hotspots
appConfig.toggles.editor   // boolean — carga editor.js bajo demanda
appConfig.toggles.popups   // boolean — activa popups al clicar hotspots
appConfig.toggles.overlays // boolean — activa overlays DOM
appConfig.toggles.embed    // boolean — modo embed (sin chrome WordPress)
appConfig.toggles.story    // string  — ID de la historia
appConfig.toggles.nointro  // boolean — salta la pantalla de intro
appConfig.toggles.scale    // number  — cobertura de viewport (legacy, afecta solo el alto)
```

---

## Límites del canvas — no exceder

```js
CANVAS_LIMITS: {
  desktop: { maxWidth: 4096, maxHeight: 4096, maxPixels: 16_000_000, maxMemoryMB: 150 },
  mobile:  { maxWidth: 2400, maxHeight: 5400, maxPixels: 13_000_000, maxMemoryMB: 72 }
}
```

Si una nueva imagen excede estos límites, `validateCanvasDimensions()` la escala automáticamente y loguea un warning. Ver los logs en consola con `?debug=1`.

DPR máximo: **1.6 desktop**, **1.5 mobile** — evita canvas gigantes en pantallas Retina.

---

## Editor visual (?editor=1)

El editor (`src/editor.js`) se carga **solo** con `?editor=1`. No está en el bundle de producción. Permite posicionar hotspots visualmente y exportar las coordenadas como JSON.

**Atajos de teclado del editor:**
- `E` — Toggle editor on/off
- `Ctrl+Z / Ctrl+Y` — Undo/Redo (hasta 50 pasos)
- `Ctrl+D` — Duplicar item
- `Ctrl+C / Ctrl+V` — Copiar/Pegar
- `H` — Hide UI
- `F` — Focus item seleccionado
- `Ctrl+S` — Guardar preset

**No modifiques `editor.js` para features de producción.** Es una herramienta de desarrollo que corre en el mismo contexto que la app pero no afecta el runtime normal.

---

## Resolución de rutas de mapas

```
Si hay historia activa (currentStoryId):
  → /data/stories/{currentStoryId}/maps/{mapId}.json

Si no hay historia (fallback default):
  → /data/maps/{mapId}.json
```

---

## Cosas que NO hacer

| ❌ No hacer | ✅ Hacer en cambio |
|---|---|
| Escribir CSS para controlar el tamaño del canvas | Modificar `setCanvasDPR()` en `app.js` |
| Llamar funciones de dibujo directamente | `markDirty('camera', 'elements', ...)` |
| Agregar `margin: 0 auto` al canvas directamente | Modificar el wrapper con cuidado |
| Usar `canvas.width / canvas.height` para coordenadas lógicas | Usar `canvas.width / dpr` o `canvas.style.width` |
| Guardar estado mutable en módulos ES sin una clase | Usar la clase correspondiente (Camera, MapManager, etc.) |
| Importar librerías pesadas | El proyecto es vanilla JS intencional — sin dependencias de runtime |
| Modificar `GLOBAL_CONFIG` en runtime | Leer de `appConfig.toggles` para flags de runtime |
| Tocar `editor.js` para features de producción | Mantenerlo como herramienta de dev aislada |
| Editar `mobile.z` para cambiar el zoom mobile | Editar `zMobileProfile` para el perfil de altura correcto |
| Usar `img.naturalWidth/naturalHeight` en la imagen del mapa | La imagen puede ser `ImageBitmap` — usar helper `imgWidth(img)` |
| Usar `left:50%; transform:translateX(-50%)` en elementos del intro con animación de entrada | Usar `left:0; right:0; display:flex; justify-content:center` — el translateY de la animación sobreescribe el translateX |
| Hardcodear delays en CSS para el subtítulo/botón/copyright del intro | Los delays se calculan dinámicamente en JS: `TW_START_DELAY + text.length * CHAR_DELAY + offset` |
| Asumir que las fotos de hotspots están en el canvas | Están en overlays DOM — `<img>` dentro de `.overlay-wrap` |
| Poner `pointer-events: auto` en `.overlay-wrap.has-caption` | El tipo B debe ser `pointer-events: none` — solo el badge tiene `pointer-events: auto` |
| Olvidar sincronizar `window.cameraInstance` con `camera` local | Agregar `cameraInstance.setPosition(camera.x, camera.y, camera.z)` después del lerp en el RAF loop |
| Dejar `breathingAllowed` sin guard de popup | Agregar `!popupManager?.isOpen()` — el breathing debe pausarse con popup abierto o el canvas redibuja innecesariamente cada frame |
| Agregar handlers de resize sin guard de popup | `handleResize`, `ResizeObserver` y `visualViewport.resize` deben retornar si `popupManager?.isOpen()` — la scrollbar del body al abrir/cerrar popup dispara resize falsos |
| Usar `:hover` en `.overlay-wrap.has-caption` para el badge ⓘ | Usar `:has(.hs-caption__badge:hover)` — el wrap tiene `pointer-events: none` |

---

## Waypoint Info Box

Caja de texto flotante que aparece en la esquina superior del canvas mostrando el título y descripción del waypoint activo. Se implementa como overlay DOM puro (`position: absolute`) dentro del `#mapa-canvas-wrapper`, igual que los demás overlays — **no empuja el layout**.

**Elementos HTML** (en `src/index.html`):
```html
<div id="waypoint-info-box" class="waypoint-info-box" aria-live="polite" hidden>
  <h3 id="waypoint-info-title" class="waypoint-info-box__title"></h3>
  <p  id="waypoint-info-desc"  class="waypoint-info-box__desc"></p>
</div>
```

**Lógica** (en `src/app.js`):
- `updateWaypointInfoBox(wp)` se llama dentro de `goToWaypoint()` en cada cambio de waypoint.
- Lee `wp.label` como título y `wp.lines[0]` como descripción.
- Si el waypoint no tiene ni `label` ni `lines`, la caja se oculta con `hidden`.

**CSS** (al final de `src/style.css`): `position: absolute; top: 0; left: 0` con `backdrop-filter: blur(12px)` y animación de entrada suave. En desktop se limita a `max-width: min(560px, 45%)` para no tapar el mapa.

---

## Comandos útiles de desarrollo

```bash
npm run dev      # localhost:5173

# URLs de desarrollo más usadas:
# Normal:
http://localhost:5173/?story=costa-rica/expedientes/0001&nointro=1&popups=1

# Con debug (overlays rojos):
http://localhost:5173/?story=costa-rica/expedientes/0001&debug=1&popups=1&overlays=1

# Con editor:
http://localhost:5173/?editor=1&debug=1&story=costa-rica/expedientes/0001

# Sin overlays (solo canvas):
http://localhost:5173/?story=costa-rica/expedientes/0001&popups=0&overlays=0&debug=1

npm run build    # Genera dist/
npm run preview  # Preview del build en localhost:4173
```

---

## Deploy

```bash
git add . && git commit -m "descripción" && git push
# Vercel detecta el push y despliega automáticamente
# URL de producción: https://map-waypoints.vercel.app/
```

---

## Estado del proyecto (Junio 2026)

- **Lighthouse 100** en rendimiento (Moto G Power, 4G lenta) — baseline establecido
- Layout fullscreen estable: ancho y alto siempre `window.innerWidth/Height`
- Multi-historia funcional via `?story=`
- Editor visual funcional con undo/redo (50 pasos), multi-select
- Primer expediente real (Costa Rica 0001) en progreso — contenido real pendiente

**Sistema de hotspots informativos tipo B (Junio 2026):**
- Overlay invisible (`vacio.png`) con badge ⓘ y tooltip descriptivo
- Hover sobre el badge activa borde dashed animado (`hs-dash-march`) + tooltip
- `pointer-events: none` en el wrap — no bloquea clicks al tipo A debajo
- Activado via campos `caption` y `noPopup: true` en `icons.json`
- CSS usa `:has(.hs-caption__badge:hover)` — cero JS en hover
- Desactivado en mobile con `@media (hover: none)`

**Fix canvas flash con popup abierto (Junio 2026):**
- `breathingAllowed` ahora incluye `!popupManager?.isOpen()` — el breathing se pausa mientras el popup está abierto
- `handleResize`, `ResizeObserver` y `visualViewport.resize` tienen guard `if (popupManager?.isOpen()) return` — evitan que la scrollbar del body al abrir/cerrar el popup dispare `setCanvasDPR()` innecesariamente
- `DetailedPopupManager.closeAll()` llama `window.setCanvasDPR?.()` + `window.markDirty?.()` en el `setTimeout` de 300ms — el canvas se recalcula correctamente cuando la scrollbar vuelve tras el cierre

**Fix de sincronización camera/breathing (Junio 2026):**
- `window.cameraInstance.setPosition()` se llama cada frame después del lerp
- Resuelve overlays DOM que no seguían el breathing de cámara

**Intro Screen (Mayo 2026):**
- Pantalla de presentación con fondo negro antes del mapa
- Logo Divergentes con link a divergentes.com
- Título con efecto typewriter JS, subtítulo y botón con fade+slide CSS
- Mapa se carga en paralelo durante el intro — cero impacto en performance
- Todos los delays sincronizados dinámicamente en JS — no hardcoded en CSS

**Sistema de imágenes optimizado:**
- `drawImage` usa `logicalW/H` como destino — imagen se escala al espacio lógico siempre
- `logicalW/H` es la fuente de verdad; la resolución física es independiente
- Decode de imagen fuera del main thread via `createImageBitmap()` — elimina ~2s de blocking

**Sistema de hotspots optimizado:**
- `icons.json` bundle: 12 requests → 1 request (~400ms de mejora en LCP)
- Fallback automático a `wp*.json` individuales si no existe el bundle

**CSS optimizado:**
- `style.css` y `popup_styles.css` cargan non-blocking (`media="print"`)

**Waypoint Info Box (Mayo 2026):**
- Caja flotante `position: absolute; top: 0` en `#mapa-canvas-wrapper` — no empuja el layout
- Lee `wp.label` y `wp.lines[0]` de los JSON de mapas
- Se actualiza en cada `goToWaypoint()` con animación de entrada suave

**Fixes de estabilidad aplicados (Mayo 2026):**
- `_loadSplitIcons` catch ahora loguea warning si `icons.json` falla
- `_onPointerDown/_onPointerUp` con guard contra null pointer si el overlay se elimina entre eventos
- `structuredClone` reemplazó `JSON.parse(JSON.stringify())` en normalización de waypoints
- Culling world-space duplicado eliminado de `OverlayLayer.endFrame()` — solo screen-space