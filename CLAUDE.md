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

1. **World space** — píxeles del mapa completo (ej: `logicalW=4240, logicalH=2049`). Los waypoints usan `xp/yp` normalizados (0.0–1.0) que se multiplican por estas dimensiones.
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

## Bugs conocidos resueltos — no reverter

### Race condition en cambio de fase (Junio 2026) — CRÍTICO

**Síntoma:** Al navegar a F2 por primera vez se veía deformada. Al ir a F3 y volver, se veía bien.

**Bug 1 — Transición en vuelo no cancelada** (`app.js`, `goToWaypoint()`):
El usuario navegaba en F1 con una transición cinemática de 1100ms activa. Si hacía click en F2 antes de que terminara, `transitionState.active` permanecía `true` con `targetPos` apuntando al waypoint de F1. El RAF loop seguía ejecutando `updateTransition()` y sobreescribía `camTarget` con la posición de F1, deformando la vista de F2.

**Fix:** `transitionState.active = false` en el bloque `isFirstLoad` de `goToWaypoint()`, antes de asignar la posición del nuevo waypoint.

**Bug 2 — Preload sobreescribía `currentMap`** (`MapManager.js`, `preloadPhase()`):
`preloadPhase()` llamaba `this.loadMap(id)` que siempre asignaba `this.currentMap` al mapa recién cargado. Si F3 terminaba de precargarse mientras el usuario ya estaba en F2, el RAF dibujaba la imagen de F2 con `logicalH` de F3 (3815 en vez de 2049) — deformación visual.

**Fix:** `loadMap()` acepta un segundo argumento `{ setAsCurrent }`. `preloadPhase()` pasa `{ setAsCurrent: false }`. El bloque de `fitBaseToViewport` en `loadMap()` usa `mapData` (retorno directo) en vez de `mapManager.currentMap`.

**Verificación Playwright:** Primera y segunda carga de F2 producen `{x:750, y:~680}`. Antes: primera carga era `{x:2116, y:1570}`.

### Dimensiones logicalH incorrectas en los JSON de mapas (Junio 2026)

**Síntoma:** Salto visual al cambiar entre fases en desktop.

**Dimensiones reales verificadas con `identify`:**
- `mapa-dektop-2x.webp` (F1): 4240 × **2049**
- `f2-mapa-dektop-2x.webp` (F2): 4240 × **2049**
- `f3-mapa-dektop-x2.webp` (F3): 4240 × **3815**

**Valores incorrectos que tenían los JSON:** F1 tenía `logicalH: 2050` (1px), F2 tenía `logicalH: 1773` (13% de error — causa principal del salto). **Regla:** Siempre verificar con `identify imagen.webp` antes de escribir `logicalH`.

### Glitch al cerrar popup (Junio 2026)

**Causa:** `DetailedPopupManager.closeAll()` llamaba `window.setCanvasDPR?.()` + `window.markDirty?.()` asumiendo que la scrollbar del body volvería al cerrar. Como `body { overflow: hidden }` es permanente, nunca hay scrollbar — esas llamadas hacían un resize de canvas innecesario produciendo flash visible.

**Fix:** Eliminar esas dos llamadas de `closeAll()`. La compensación de scrollbar (`paddingRight`) también es no-op porque `scrollbarW` siempre es 0.

---


### Hotspots tipo B abriendo popup vacío en Fase 3 (Junio 2026)

**Síntoma:** Los hotspots tipo B (`noPopup: true`) en `mapa_f3` abrían el popup detallado vacío al hacer click, a pesar de tener `noPopup: true` en el JSON y `vacio.png` como imagen. En F1 y F2 funcionaban correctamente.

**Causa:** Hay **dos sistemas independientes de hit-testing** en `app.js`:
1. `OverlayLayer._onPointerUp()` — maneja clicks en los overlays DOM. Sí respeta `noPopup`.
2. Un handler de `mousedown`/`click` sobre el canvas que itera `state.currentIcons[state.idx]` y llama `openPopup(item)` directamente — **sin verificar `item.noPopup`**.

Los logs de `[noPopup debug]` nunca aparecían porque el canvas interceptaba el click antes de que llegara al `OverlayLayer`. El bug existía en las tres fases pero F1/F2 no lo manifestaban porque sus tipo B coincidían en posición con el tipo A (que sí abre popup correctamente), enmascarando el problema.

**Fix:** En `app.js`, en el bloque de hit-testing del canvas, agregar el guard antes de `openPopup`:
```js
if (isHit) {
  if (item.noPopup) return;  // ← guard para tipo B
  openPopup(item);
  return;
}
```

**Lección:** Cuando `OverlayLayer` no dispara su log de debug, el click no está llegando ahí — buscar el handler en `app.js` que procesa el canvas directamente.

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
- `upsert()`: si `meta.caption` existe **Y** `GLOBAL_CONFIG.SHOW_CAPTION_BADGES === true`, se inyecta `.hs-caption` (badge + tooltip) como hijo del wrap. Si el flag está en `false`, el campo `caption` del JSON se ignora silenciosamente — ningún elemento DOM se genera.
- CSS: `.overlay-wrap.has-caption` tiene `pointer-events: none`. Solo `.hs-caption__badge` tiene `pointer-events: auto`.
- CSS: el hover usa `:has(.hs-caption__badge:hover)` para activar borde dashed y tooltip — cero JS.
- CSS: `hs-dash-march` (@keyframes) solo corre cuando el cursor está sobre el badge — no consume GPU en reposo.

**Feature flag `SHOW_CAPTION_BADGES` (`config.js`):**
- `false` (default en producción) — badges no se renderizan. Los datos `caption` en `icons.json` se preservan.
- `true` — activa el sistema completo de badges.
- Toggle por URL: `?badges=1` activa en dev/QA sin tocar el flag. `?badges=0` desactiva.
- El CSS de `.hs-caption` siempre va en el bundle (trivial en peso) pero no tiene efecto si no hay elementos con esa clase.

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

### logicalW/H — SIEMPRE verificar antes de escribir

**Nunca escribir `logicalW/H` sin verificar las dimensiones reales de la imagen:**
```bash
identify imagen.webp   # Linux/Mac con ImageMagick
sips -g pixelWidth -g pixelHeight imagen.webp  # Mac sin ImageMagick
```

Un `logicalH` incorrecto hace que la cámara calcule zoom y posición sobre una escala incorrecta — causa deformación visible al cambiar de fase (ver bug resuelto arriba).

**Dimensiones verificadas — Expediente 0001:**

| Imagen | logicalW | logicalH |
|---|---|---|
| `mapa-dektop-2x.webp` (F1 desktop) | 4240 | **2049** |
| `f2-mapa-dektop-2x.webp` (F2 desktop) | 4240 | **2049** |
| `f3-mapa-dektop-x2.webp` (F3 desktop) | 4240 | **3815** |
| `mapa-mobile-2x.webp` (F1 mobile) | 1400 | 1789 |
| `f2-mapa-mobile-x2.webp` (F2 mobile) | 1400 | 1650 |
| `mapa-mobile.webp` (F3 mobile) | 1400 | 3181 |

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

### Hotspot offsets: son relativos al waypoint en px del mundo

```js
// offsetX/offsetY son desplazamientos desde el waypoint en coordenadas world
const iconX = waypoint.x + icon.offsetX;
const iconY = waypoint.y + icon.offsetY;
```

No necesitan recalcularse al cambiar la imagen.

### Hotspots reactivos al zoom (modelo world-space) — PENDIENTE DE IMPLEMENTAR

**El problema actual:** los hotspots en `icons.json` usan `offsetX/offsetY/width/height` en **píxeles de pantalla fijos**. Cuando cambia `desktop.z` o `zMobileProfile`, el mapa se acerca/aleja pero el hotspot mantiene su tamaño en pantalla — deja de cubrir la zona visual que se quería marcar.

**Por qué ocurre:** `MapManager._normalizeIcons()` convierte `offsetX/offsetY` a coordenadas world absolutas, pero pasa `width/height` como px fijos a `lockWidthPx` en `OverlayLayer`. El tamaño no escala con el zoom.

**La solución (aún no implementada):** migrar al modelo `xp/yp/wp/hp` normalizado (0.0–1.0 relativo a `logicalW/H`). Este modelo ya existe y funciona para `window.hotspotData` (el editor), donde el tamaño en pantalla se calcula como:
```js
screenWidth  = (wp * logicalW) * camera.z
screenHeight = (hp * logicalH) * camera.z
```
El hotspot crece y encoge exactamente con el zoom — siempre cubre la misma zona del mapa.

**Qué habría que hacer para implementarlo:**

1. **`MapManager._normalizeIcons()`** — detectar si el icono usa `xp/yp/wp/hp` y pasarlos a través sin convertir a px.
2. **`app.js` loop de render** — en el bloque de `iconsForWaypoint`, si el icono tiene `xp/yp/wp/hp`, calcular `screenWidth = wp * logicalW * camera.z` igual que hace el bloque de `hotspotData`.
3. **`icons.json`** — migrar los hotspots al nuevo formato usando la fórmula de conversión:
   ```
   xp = (waypoint.mobile.xp * logicalW + hotspot.mobile.offsetX) / logicalW
   yp = (waypoint.mobile.yp * logicalH + hotspot.mobile.offsetY) / logicalH
   wp = hotspot.mobile.width  / logicalW
   hp = hotspot.mobile.height / logicalH
   ```

**Riesgo:** cambio de arquitectura en `MapManager` y `app.js`. Hacerlo en una rama separada, verificar con `?debug=1` que los hotspots siguen en posición correcta antes de mergear.

**Mientras tanto:** al cambiar `desktop.z`, los hotspots de `icons.json` **no se reposicionan solos** — hay que ajustar `offsetX/offsetY` manualmente con el editor (`?editor=1`) para cada waypoint afectado.

### Convención multi-fase: F2 es copia de F1

`mapa_f2.json` replica exactamente todos los parámetros de cámara de `mapa_f1.json`. Cualquier cambio de zoom o posicionamiento en F1 debe aplicarse también en F2.

**Valores canónicos compartidos (F1 = F2):**
- `desktop.logicalW/H`: `4240 × 2049` ← verificado con `identify`
- `desktop.z`: `0.85` en todos los waypoints
- `desktop.xp/yp`, `yOffset`, `zMobileProfile`: idénticos waypoint por waypoint
- `mobile.logicalW`: `1400` (mismo ancho)

**Diferencia legítima F2 vs F1:**
- `mobile.logicalH`: F1 = `1789`, F2 = `1650` (imágenes mobile de distinto alto)
- `mobile.yp` de fila 1: distintos porque los hotspots caen en zonas diferentes de cada imagen

**Para sincronizar F2 cuando cambies F1:**
```js
f1.waypoints.forEach((wp1, i) => {
  f2.waypoints[i].desktop        = structuredClone(wp1.desktop);
  f2.waypoints[i].yOffset        = structuredClone(wp1.yOffset);
  f2.waypoints[i].zMobileProfile = structuredClone(wp1.zMobileProfile);
  // NO tocar mobile.yp ni mobile.xp — son propios de cada imagen
});
```

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
| Escribir `logicalW/H` sin verificar dimensiones reales | `identify imagen.webp` primero siempre |
| Llamar `loadMap()` desde `preloadPhase()` sin `{ setAsCurrent: false }` | El preload no debe sobreescribir `currentMap` — causa deformación si otra fase termina de cargar mientras el usuario está en otra |
| Dejar una transición cinemática en vuelo al cambiar de fase | `transitionState.active = false` antes de `goToWaypoint(0)` en cada `loadMap()` |
| Llamar `setCanvasDPR()` o `markDirty()` desde `closeAll()` del popup | El body tiene `overflow: hidden` permanente — no hay scrollbar que compensar, produce flash innecesario |
| Olvidar sincronizar `window.cameraInstance` con `camera` local | Agregar `cameraInstance.setPosition(camera.x, camera.y, camera.z)` después del lerp en el RAF loop |
| Dejar `breathingAllowed` sin guard de popup | Agregar `!popupManager?.isOpen()` — el breathing debe pausarse con popup abierto o el canvas redibuja innecesariamente cada frame |
| Agregar handlers de resize sin guard de popup | `handleResize`, `ResizeObserver` y `visualViewport.resize` deben retornar si `popupManager?.isOpen()` — la scrollbar del body al abrir/cerrar popup dispara resize falsos |
| Usar `:hover` en `.overlay-wrap.has-caption` para el badge ⓘ | Usar `:has(.hs-caption__badge:hover)` — el wrap tiene `pointer-events: none` |
| Asumir que `noPopup: true` en `icons.json` es suficiente para bloquear el popup | El canvas tiene su propio hit-test en `app.js` que llama `openPopup()` directamente — ese path también necesita el guard `if (item.noPopup) return` |
| Llamar `goToWaypoint(0)` directamente al cambiar de fase con `goToLast=true` | Pasar `goToLast` a `loadMap()` — `loadMap` llama `goToWaypoint` internamente; hacerlo después pisa el índice |
| Agregar `classList.add('is-fading')` sin `offsetHeight` previo en mobile | Forzar reflow con `el.offsetHeight` antes de agregar la clase — sin reflow el browser colapsa la transición en un solo frame |
| Omitir `el.classList.remove('is-hiding')` al cerrar el brief | La clase `is-hiding` tiene `opacity:0` — si queda pegada, el siguiente `el.hidden=false` muestra el panel invisible |

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

# Con badges ⓘ activados (desactivados en producción por defecto):
http://localhost:5173/?story=costa-rica/expedientes/0001&nointro=1&popups=1&badges=1

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
- Primer expediente real (Costa Rica 0001): contenido de texto completo — `label`/`lines`, tono/legal, `involved`/`echos` en las 3 fases (Junio 2026). Pendiente: 25 imágenes + 4 referencias a avatares existentes para hotspots tipo B, y `thumb.webp` (ver `docs/editorial/expediente-0001/`)

**Sistema de hotspots informativos tipo B (Junio 2026):**
- Overlay invisible (`vacio.png`) con badge ⓘ y tooltip descriptivo
- Hover sobre el badge activa borde dashed animado (`hs-dash-march`) + tooltip
- `pointer-events: none` en el wrap — no bloquea clicks al tipo A debajo
- Activado via campos `caption` y `noPopup: true` en `icons.json`
- CSS usa `:has(.hs-caption__badge:hover)` — cero JS en hover
- Desactivado en mobile con `@media (hover: none)`
- **`SHOW_CAPTION_BADGES: false` en producción** — feature flag en `config.js`. Activa en dev con `?badges=1`. Los datos `caption` en JSON se preservan siempre.

**Lista de implicados: filtro sticky + grupos reordenables (Junio 2026):**
- `.popup-detailed__involved` (fila de avatares "Implicados") es ahora una **barra sticky** (`position: sticky; top: 0`) dentro de `.popup-detailed__content` — actúa como filtro siempre accesible mientras se hace scroll por los echos. Sin `backdrop-filter` (ya lo aplica `.popup-detailed`, duplicarlo en el sticky encarece cada frame de scroll); usa `background: var(--popup-bg)`/`var(--popup-bg-mobile)` + `box-shadow` para indicar que está "pegada". En mobile se oculta `.popup-detailed__person-role` dentro de la barra para ahorrar espacio
- `updateEchos()` (re-render destructivo por click) fue **eliminado** y reemplazado por:
  - `buildEchoGroups(hotspot)` — se llama una sola vez en `openDetailedPopup()`, después de `renderInvolved`. Crea un `<section class="popup-detailed__echo-group">` por cada implicado con `echos` para ese hotspot (orden: `highlighted: true` primero, resto en orden de `involved[]`). Implicados sin echos para ese hotspot no generan grupo — su avatar sigue arriba como filtro
  - `_createEchoGroup(person, echos)` — helper que crea cada grupo (header con avatar+nombre + lista de echos). `animation-delay` escalonado limitado a los primeros 15 echos para no alargar el efecto cascada con varios grupos
  - `promotePerson(personId)` — al click en un avatar, hace `prepend()` del grupo correspondiente (O(1), no re-decodifica imágenes ni relanza `echoSlideIn`) + scroll suave al inicio de la lista de echos. Si la persona no tiene echos para ese hotspot, no hace nada
  - `this.echoGroupEls` (Map personId → elemento) se limpia en `closeAll()`
- `index.html`: se eliminó el `<h4 id="popup-detailed-echos-title">` y el divider huérfano de `#popup-detailed-echos-section` — cada grupo trae su propio header

## Contenido editorial por historia — docs/editorial/{historia}/

Cada historia con contenido real tiene una carpeta `docs/editorial/{id}/` (fuera de `public/`, no se publica) con el sistema de seguimiento de "personas implicadas":

- `personas.json` — registro canónico: id, name, avatar, caseRole, status, bio, appearsIn, _echosStatus. Es la FUENTE DE VERDAD que `involved[].id`/`echos{}` en los `icons.json` deben usar — mismo id en las 3 fases.
- `grid-implicados.md` — tabla de seguimiento: perfil base de cada persona, dónde aparece, qué `echos` faltan.
- `shot-list-*.md` — imágenes pendientes para hotspots tipo B, por fase.
- `audit_gaps.py` — corre desde `maps/`, detecta `involved[]` sin `echos` correspondiente y captions tipo B con placeholder (lorem ipsum / TODO).

Antes de escribir `involved`/`echos`/captions para una historia, revisar esta carpeta — evita duplicar ids o reescribir contenido ya existente.

**Fixes Junio 2026:**
- Race condition en cambio de fase: transición en vuelo cancelada con `transitionState.active = false` + `preloadPhase()` con `{ setAsCurrent: false }` — verificado con Playwright
- Dimensiones `logicalH` corregidas: F1 `2050→2049`, F2 `1773→2049` (verificadas con `identify`)
- Glitch al cerrar popup: `setCanvasDPR()` + `markDirty()` eliminados de `closeAll()` (eran no-op con `overflow:hidden` permanente)

**UX de navegación entre fases (Junio 2026):**

- **Transición con fade negro** — `_fadePhase()` con overlay `.phase-transition-overlay` (CSS `opacity 0.55s`, z-index 150). El mapa carga mientras la pantalla está negra. Aplicado en `handlePhaseChange` y `handleMapChange`.
- **Secuencia intro → canvas → brief reordenada** — el RAF arranca y el mask del canvas se retira *antes* de mostrar el brief. El brief aparece encima del canvas ya pintado. `offsetHeight` forzado antes de `classList.add('is-fading')` para garantizar la transición en mobile real.
- **Brief de cierre** — al llegar al último waypoint de la última fase, `showFullLineOrNext` llama `showBrief({ html: CLOSING_BRIEF_HTML, skipTypewriter: true, btnLabel: '← Inicio' })`. Al cerrar ejecuta `location.reload()` para volver al intro limpiamente.
- **`showBrief` ampliado** — acepta `html` (innerHTML directo, sin typewriter), `skipTypewriter` y `btnLabel`. `waitForBrief` resetea el botón a "Entendido" y limpia `is-hiding` al cerrar.
- **Hint en botón de siguiente fase** — `uiManager.setNextPhaseHint(isLast, nextPhaseId)` se llama en cada `goToWaypoint()`. Agrega `.is-hinting` al botón de la siguiente fase con `conic-gradient` rotando en `::after` (compositor GPU, `prefers-reduced-motion` respetado).
- **Navegación continua entre fases** — `showFullLineOrNext` en último waypoint avanza a siguiente fase (`uiManager.selectPhase(nextPhaseId)`). `prev()` en waypoint 0 va al último waypoint de la fase anterior (`uiManager.selectPhase(prevPhaseId, true)`). El flag `goToLast` se propaga `UIManager → handlePhaseChange → loadMap` — `loadMap` llama `goToWaypoint(length-1)` en vez de `goToWaypoint(0)`.
- **Fix rama `SHOW_DIALOGS: false`** — `prev()` tenía un `return` prematuro en la rama `!SHOW_DIALOGS` que impedía el cambio de fase hacia atrás. Corregido incluyendo el bloque `prevPhaseId` dentro de esa rama.
- **Minimap desactivado** — `SHOW_MINIMAP: false` en `config.js`, guard en `drawMinimap()`, `display: none` en CSS. Para reactivar: `SHOW_MINIMAP: true` + quitar `display: none`.
- **Brief mobile como bottom sheet** — en `@media (max-width: 520px)`: `align-items: stretch`, `justify-content: flex-end`, `border-radius: 18px 18px 0 0`, `max-height: 92vh`. El panel sube desde abajo, el body scrollea desde el inicio del contenido.

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