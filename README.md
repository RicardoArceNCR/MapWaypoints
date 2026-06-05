# Mapa Interactivo Multi-Fase — Documentación Técnica

> **Estado actual:** Producción-ready. Desplegado en Vercel. Integrado en WordPress vía iframe.
> **Lighthouse score:** 100 Rendimiento / 96 Accesibilidad / 100 Prácticas / 100 SEO (Mayo 2026, Moto G Power emulado, 4G lenta)

---

## Índice

1. [Qué es este proyecto](#1-qué-es-este-proyecto)
2. [Arquitectura general](#2-arquitectura-general)
3. [Estructura de archivos](#3-estructura-de-archivos)
4. [Módulos JavaScript](#4-módulos-javascript)
5. [Sistema de datos — Historias y Mapas](#5-sistema-de-datos--historias-y-mapas)
6. [Parámetros URL](#6-parámetros-url)
7. [Sistema de distribución — WordPress](#7-sistema-de-distribución--wordpress)
8. [Deploy — Vercel](#8-deploy--vercel)
9. [Flujo de desarrollo](#9-flujo-de-desarrollo)
10. [Agregar una nueva historia](#10-agregar-una-nueva-historia)
11. [Agregar un nuevo mapa a una historia](#11-agregar-un-nuevo-mapa-a-una-historia)
12. [Cambiar la imagen del mapa](#12-cambiar-la-imagen-del-mapa)
13. [Sistema de layout y viewport](#13-sistema-de-layout-y-viewport)
14. [Waypoint Info Box](#14-waypoint-info-box)
15. [Optimizaciones de performance implementadas](#15-optimizaciones-de-performance-implementadas)
16. [Pendientes y roadmap](#16-pendientes-y-roadmap)

---

## 1. Qué es este proyecto

Aplicación web de mapas interactivos narrativos para periodismo de investigación. Permite contar historias geoespaciales por fases, con waypoints, hotspots clicables, overlays animados y popups con información detallada (personas implicadas, fechas, ubicaciones, hechos).

**El modelo de negocio:**
- Tú produces las historias (JSON + imágenes) y las publicas en Vercel.
- Los clientes (medios, periodistas) embeben el mapa en su WordPress con un snippet HTML o una plantilla PHP.
- Cada historia es una URL única: `map-waypoints.vercel.app/?story=costa-rica/expedientes/0001`

---

## 2. Arquitectura general

```
┌─────────────────────────────────────────────────────┐
│           VERCEL (map-waypoints.vercel.app)          │
│                                                     │
│  ┌──────────┐  fetch   ┌──────────────────────┐    │
│  │  app.js  │ ──────► │  /data/story.json     │    │
│  │ (Canvas  │          │  /data/stories/       │    │
│  │  + UI)   │ ──────► │    {id}/story.json    │    │
│  └──────────┘          │    {id}/maps/*.json   │    │
│       │                └──────────────────────┘    │
│       │ postMessage(height)                         │
└───────┼─────────────────────────────────────────────┘
        │ iframe
┌───────┼─────────────────────────────────────────────┐
│       ▼          WORDPRESS (cliente)                │
│  ┌──────────┐                                       │
│  │  iframe  │  ← snippet HTML o plantilla PHP       │
│  └──────────┘                                       │
└─────────────────────────────────────────────────────┘
```

**Flujo de carga:**
1. WordPress carga la página con el iframe apuntando a Vercel
2. La app en Vercel arranca y lee `/data/story.json` (o el específico via `?story=`)
3. Se carga el primer mapa lazy (`/data/stories/{id}/maps/mapa_f1.json`)
4. Canvas renderiza el mapa con waypoints, overlays y hotspots
5. `postMessage` comunica la altura al iframe padre en WordPress

---

## 3. Estructura de archivos

```
map-waypoints/
├── src/                          ← Código fuente (Vite lo compila)
│   ├── app.js                    ← Entrada principal, loop de render, boot
│   ├── MapManager.js             ← Carga de historias, mapas, caché de imágenes
│   ├── Camera.js                 ← Sistema de cámara, zoom, pan, transiciones
│   ├── UIManager.js              ← Filtros de fase, drawer, progress, selector de mapas
│   ├── OverlayLayer.js           ← Overlays DOM (iconos clicables sobre el canvas)
│   ├── DetailedPopupManager.js   ← Popups con personas, fechas, hechos
│   ├── editor.js                 ← Editor visual (carga bajo demanda con ?editor=1)
│   ├── config.js                 ← GLOBAL_CONFIG técnico (sin datos de negocio)
│   ├── index.html                ← HTML base
│   ├── style.css                 ← Estilos principales
│   └── popup_styles.css          ← Estilos de popups detallados
│
├── public/                       ← Archivos estáticos (Vite los copia a dist/ sin procesar)
│   ├── assets/                   ← Imágenes, fuentes, GIFs
│   │   ├── fonts/                ← Inter woff2 (self-hosted)
│   │   ├── mapa-mobile.webp      ← Imagen mapa mobile (1400×3181px físicos, logicalW:1400 logicalH:3181)
│   │   ├── mapa-dektop-4x.webp   ← Imagen mapa desktop (4240×3685px, logicalW:4240 logicalH:3685)
│   │   ├── fase-2-mapa-mobile-x4.webp  ← Fase 2 mobile (compartida temporalmente con fase 1)
│   │   ├── fase-2-mapa-dektop-4x.webp  ← Fase 2 desktop
│   │   ├── fase-3-mapa-mobile-x4.webp  ← Fase 3 mobile
│   │   ├── fase-3-mapa-dektop-4x.webp  ← Fase 3 desktop
│   │   └── persona_1-*.gif       ← Avatares animados de personas
│   │
│   └── data/                     ← Sistema de datos de historias
│       ├── story.json            ← Historia DEFAULT (fallback sin ?story=)
│       ├── index.json            ← Catálogo de todas las historias
│       ├── maps/                 ← Mapas del story default
│       │   ├── mapa_f1.json
│       │   ├── mapa_f2.json
│       │   └── mapa_f3.json
│       └── stories/              ← Historias nombradas
│           └── costa-rica/
│               └── expedientes/
│                   └── 0001/     ← Primera historia real
│                       ├── story.json
│                       └── maps/
│                           ├── mapa_f1.json       ← Plantilla canónica (logicalW:1400, iconsDir:true)
│                           ├── mapa_f2.json       ← Copia estructural de f1 (mismo logicalW/H mobile)
│                           ├── mapa_f3.json       ← Copia estructural de f1 (mismo logicalW/H mobile)
│                           ├── mapa_f1_icons/
│                           │   ├── icons.json  ← Bundle de todos los hotspots (1 request)
│                           │   └── wp*.json    ← Archivos individuales (fallback automático)
│                           ├── mapa_f2_icons/
│                           │   ├── icons.json  ← Bundle hotspots f2 (formato hotspot, no embebido)
│                           │   └── wp*.json    ← Fallback individual
│                           └── mapa_f3_icons/
│                               ├── icons.json  ← Bundle hotspots f3
│                               └── wp*.json    ← Fallback individual
│
├── dist/                         ← Build de producción (generado por npm run build)
├── vercel.json                   ← Headers HTTP para iframe y seguridad
├── vite.config.js                ← Configuración de build
└── package.json                  ← Scripts y dependencias
```

---

## 4. Módulos JavaScript

### `app.js` — Orquestador principal
Contiene el loop de animación (`requestAnimationFrame`), el sistema de dirty flags, el boot de la aplicación y la lógica de viewport/resize.

**Responsabilidades clave:**
- Parsear parámetros URL (`parseUrlToggles`)
- Inicializar todos los módulos en orden correcto
- Ejecutar `mapManager.loadStory()` antes de instanciar `UIManager`
- Comunicar altura al iframe padre via `postMessage`
- Loop de render con dirty flags (solo redibuja cuando hay cambios)

**Sistema dirty flags:**
```js
markDirty('camera', 'elements', 'dialog', 'minimap', 'debug')
// Solo redibuja las capas marcadas como sucias
```

**Toggle de popups en runtime:**
```js
window.togglePopupDisplay(true/false)  // habilita/deshabilita popups sin recargar
```

### `MapManager.js` — Gestor de datos y caché
Maneja la carga de historias, mapas e imágenes con caché inteligente.

**Métodos principales:**
```js
mapManager.loadStory(url)         // Carga story.json, puebla PHASES y MAPS_CONFIG
mapManager.loadMap(mapId)         // Fetch lazy del JSON del mapa, cachea en MAPS_CONFIG
mapManager.getCurrentPhaseMaps()  // Retorna mapas de la fase activa
mapManager.setPhase(phaseId)      // Cambia fase y pre-carga la siguiente
```

**Resolución de rutas de mapas:**
```
Si hay historia activa (currentStoryId):
  → /data/stories/{currentStoryId}/maps/{mapId}.json

Si no hay historia (fallback default):
  → /data/maps/{mapId}.json
```

**Caché de imágenes:**
- `imageCache` — Map de imágenes cargadas por URL
- `renderedCache` — Map de ImageBitmap pre-renderizados (OffscreenCanvas)
- Detección automática de WebP con fallback a JPG
- Usa `createImageBitmap()` para decodificar fuera del main thread (ver sección 14)

**Bundle de hotspots:**
- `_loadSplitIcons()` intenta `icons.json` primero (1 request)
- Fallback automático a `wp0.json`, `wp1.json`... si no existe el bundle

### `Camera.js` — Sistema de cámara
Maneja zoom, pan, transiciones cinematográficas entre waypoints y el efecto breathing.

**Efectos configurables en `GLOBAL_CONFIG.CAMERA_EFFECTS`:**
- `breathingEnabled` — Movimiento sutil constante del mapa
- `transitionEnabled` — Zoom-out suave entre waypoints
- `transitionDuration` — 1100ms desktop, 800ms mobile
- `disableBreathingDuringTransition` — Evita conflicto entre efectos

### `OverlayLayer.js` — Overlays DOM
Crea elementos `<div>` sobre el canvas para los iconos clicables (hotspots). Usa coordenadas del mundo del mapa y las transforma a coordenadas de pantalla en cada frame.

**Características:**
- Culling automático — oculta overlays fuera del viewport
- Hit testing con margen configurable (`TOUCH.hitSlop`)
- Tamaño mínimo de toque: 56px mobile, 40px desktop
- Dispara `overlay:click` → abre popup via `popupManager`

### `DetailedPopupManager.js` — Popups
Sistema de popups modales con estructura detallada: imagen principal, fecha/hora, ubicación, descripción, personas implicadas y echos (eventos relacionados por persona).

### `UIManager.js` — Interfaz de usuario
Renderiza el filtro de fases (botones superiores), el selector de mapas, el drawer lateral mobile y los puntos de progreso.

### `editor.js` — Editor visual
Herramienta de desarrollo para posicionar hotspots y overlays visualmente. Se carga **solo** con `?editor=1` — no afecta el bundle de producción.

**Atajos de teclado:**
- `E` — Toggle editor on/off
- `Ctrl+Z / Ctrl+Y` — Undo/Redo (hasta 50 pasos)
- `Ctrl+D` — Duplicar item
- `Ctrl+C / Ctrl+V` — Copiar/Pegar
- `H` — Hide UI
- `F` — Focus item seleccionado
- `Ctrl+S` — Guardar preset

---

## 5. Sistema de datos — Historias y Mapas

### `story.json` — Estructura de una historia

```json
{
  "phases": [
    {
      "id": "fase1",
      "label": "Fase 1",
      "color": "#1BC6EB",
      "maps": ["mapa_f1"]
    }
  ],
  "mapsIndex": {
    "mapa_f1": {
      "id": "mapa_f1",
      "name": "Recorrido 1",
      "phase": "fase1"
    }
  }
}
```

### `mapa_fN.json` — Estructura de un mapa con waypoints

```json
{
  "id": "mapa_f1",
  "name": "Recorrido 1",
  "phase": "fase1",
  "mapImage": {
    "mobile": {
      "src": "/assets/mapa-mobile.webp?v=2026-05-21",
      "logicalW": 1400,
      "logicalH": 3181
    },
    "desktop": {
      "src": "/assets/mapa-dektop-4x.webp?v=2026-05-20",
      "logicalW": 4240,
      "logicalH": 3685
    },
    "useNaturalSize": false
  },
  "waypoints": [
    {
      "mobile":  { "xp": 0.17, "yp": 0.20, "z": 0.9 },
      "desktop": { "xp": 0.18, "yp": 0.21, "z": 1.0 },
      "yOffset": { "default": 0, "tall": -90, "medium": -5, "short": 40 },
      "zMobileProfile": { "default": 0.56, "tall": 0.66, "medium": 0.60, "short": 0.52 },
      "label": "Inicio del Viaje",
      "lines": ["Texto de la escena.", "Segunda línea opcional."]
    }
  ]
}
```

### `mapa_f1_icons/icons.json` — Bundle de hotspots (formato actual)

```json
{
  "wp0": [ { "type": "hotspot", "mobile": {...}, "desktop": {...}, ... } ],
  "wp1": [ ... ],
  "wp11": [ ... ]
}
```

`_loadSplitIcons()` intenta este archivo primero. Si no existe, carga `wp0.json`...`wpN.json` individualmente como fallback. **Al agregar un nuevo mapa con hotspots, crear el `icons.json` bundle.**

### `index.json` — Catálogo de historias

```json
{
  "stories": [
    {
      "id": "costa-rica/expedientes/0001",
      "title": "Expediente 0001",
      "description": "Descripción breve del caso",
      "thumbnail": "/data/stories/costa-rica/expedientes/0001/thumb.webp",
      "url": "/?story=costa-rica/expedientes/0001",
      "published": true,
      "date": "2025-06-01",
      "country": "Costa Rica",
      "tags": ["expediente"]
    }
  ]
}
```

---

## 6. Parámetros URL

| Parámetro | Tipo | Descripción |
|---|---|---|
| `?story=` | string | ID de la historia (ej: `costa-rica/expedientes/0001`) |
| `?debug=1` | boolean | Muestra grilla, labels y logs de hotspots |
| `?editor=1` | boolean | Carga el editor visual de posicionamiento |
| `?popups=1` | boolean | Activa/desactiva popups al clicar hotspots |
| `?overlays=0` | boolean | Activa/desactiva overlays DOM |
| `?embed=1` | boolean | Modo embed (sin chrome del WordPress) |
| `?scale=` | number | Cobertura de viewport (legacy, afecta solo el alto) |

```js
// Acceso en código via:
appConfig.toggles.debug    // boolean
appConfig.toggles.story    // string
// etc.
```

---

## 7. Sistema de distribución — WordPress

**Snippet HTML básico:**
```html
<iframe
  src="https://map-waypoints.vercel.app/?story=costa-rica/expedientes/0001"
  width="100%"
  height="100vh"
  frameborder="0"
  allow="fullscreen"
  style="border:none; display:block;"
></iframe>
```

**Plantilla PHP fullscreen:** Disponible como plantilla de página de WordPress que ocupa el 100% del viewport eliminando header/footer. La app envía `postMessage` con su altura para que el iframe pueda ajustarse.

---

## 8. Deploy — Vercel

```bash
git add . && git commit -m "descripción" && git push
# Vercel detecta el push y despliega automáticamente
# URL de producción: https://map-waypoints.vercel.app/
```

Headers configurados en `vercel.json`:
- `X-Frame-Options: ALLOWALL` — permite embedding en iframe
- Cache headers para assets estáticos

---

## 9. Flujo de desarrollo

```bash
# 1. Arrancar dev server
npm run dev
# → http://localhost:5173

# 2. Desarrollar con historia real + debug
http://localhost:5173/?story=costa-rica/expedientes/0001&debug=1&popups=1&overlays=1

# 3. Posicionar hotspots con el editor
http://localhost:5173/?editor=1&debug=1&story=costa-rica/expedientes/0001

# 4. Verificar solo canvas (sin overlays)
http://localhost:5173/?story=costa-rica/expedientes/0001&popups=0&overlays=0&debug=1

# 5. Build y deploy
npm run build
git add . && git commit -m "..." && git push
```

---

## 10. Agregar una nueva historia

```bash
# 1. Crear carpeta
mkdir -p public/data/stories/panama/expedientes/0001/maps

# 2. Copiar y editar story.json
cp public/data/stories/costa-rica/expedientes/0001/story.json \
   public/data/stories/panama/expedientes/0001/story.json

# 3. Copiar y editar mapas
cp public/data/stories/costa-rica/expedientes/0001/maps/mapa_f1.json \
   public/data/stories/panama/expedientes/0001/maps/mapa_f1.json

# 4. Registrar en index.json (agregar entrada al array "stories")

# 5. Verificar y deploy
# http://localhost:5173/?story=panama/expedientes/0001&debug=1&popups=1
npm run build && git add . && git commit -m "agrega Panama 0001" && git push
```

---

## 11. Agregar un nuevo mapa a una historia

En `story.json`, agregar el ID al array `maps` de la fase y una entrada en `mapsIndex`:

```json
{
  "phases": [{ "id": "fase1", "maps": ["mapa_f1", "mapa_f1b"] }],
  "mapsIndex": {
    "mapa_f1":  { "id": "mapa_f1",  "name": "Recorrido 1",  "phase": "fase1" },
    "mapa_f1b": { "id": "mapa_f1b", "name": "Recorrido 1B", "phase": "fase1" }
  }
}
```

Crear el archivo del mapa nuevo copiando uno existente y editando imagen y waypoints. El selector de mapas en la UI aparece automáticamente cuando hay más de uno por fase.

Si el mapa tiene hotspots, crear también el bundle:
```bash
# Crear icons.json combinando los wp*.json
node -e "
const fs = require('fs'), path = require('path');
const dir = 'public/data/stories/.../maps/mapa_f1b_icons';
const bundle = {};
fs.readdirSync(dir).filter(f => f.match(/^wp\d+\.json$/)).forEach(f => {
  const key = f.replace('.json','');
  bundle[key] = JSON.parse(fs.readFileSync(path.join(dir,f)));
});
fs.writeFileSync(path.join(dir,'icons.json'), JSON.stringify(bundle,null,2));
"
```

---

## 12. Cambiar la imagen del mapa

### Paso 1 — Obtener dimensiones reales

```bash
sips -g pixelWidth -g pixelHeight public/assets/nueva-imagen.webp
# O en Linux:
identify public/assets/nueva-imagen.webp
```

### Paso 2 — Actualizar `mapImage` en el JSON

```json
"mapImage": {
  "mobile":  { "src": "/assets/nueva-mobile.webp?v=YYYY-MM-DD", "logicalW": W, "logicalH": H },
  "desktop": { "src": "/assets/nueva-desktop.webp?v=YYYY-MM-DD", "logicalW": W, "logicalH": H }
}
```

El `?v=YYYY-MM-DD` fuerza al browser a no usar la versión cacheada.

### Paso 3 — Sobre los waypoints

Los waypoints usan `xp/yp` normalizados (0.0–1.0). Si la nueva imagen mantiene
el mismo `logicalH`, no hay que recalcular nada.

**Solo recalculá si cambiás el `logicalH`** (por ejemplo, al recortar el alto):

```
yp_nuevo = (yp_viejo × logicalH_viejo) / logicalH_nuevo
```

Script Python para recalcular todos los waypoints de un mapa de una vez:

```python
python3 -c "
old_h = 3685   # logicalH viejo
new_h = 2050   # logicalH nuevo

wps = [
    ('wp_f1_col1', 0.135685),
    ('wp_f1_col2', 0.133786),
    # ... agregar todos los waypoints del mapa
]

for wp, yp_old in wps:
    yp_new = round((yp_old * old_h) / new_h, 6)
    print(f'{wp}: {yp_old} → {yp_new}')
"
```

Reglas:
- Solo cambia `yp` en el bloque `desktop` si recortaste la imagen desktop
- Solo cambia `yp` en el bloque `mobile` si recortaste la imagen mobile
- `xp`, `yOffset`, `zMobileProfile` y hotspot offsets **nunca cambian**
- Al terminar, actualiza `logicalH` y el `?v=fecha` en el JSON del mapa

### Paso 4 — Verificar `CANVAS_LIMITS` en `src/config.js`

```js
CANVAS_LIMITS: {
  desktop: { maxWidth: 4096, maxHeight: 4096, maxPixels: 16_000_000, maxMemoryMB: 150 },
  mobile:  { maxWidth: 2400, maxHeight: 5400, maxPixels: 13_000_000, maxMemoryMB: 72 }
}
```

### Nota sobre resolución física vs logicalW/H

`logicalW/H` es la fuente de verdad del espacio de coordenadas. La imagen física puede ser cualquier resolución siempre que mantenga la proporción. El sistema escala la imagen al espacio lógico con `ctx.drawImage(img, 0, 0, logicalW, logicalH)`.

---

## 13. Sistema de layout y viewport

### Cómo funciona el sizing del canvas

El canvas **no tiene tamaño fijo** — sus dimensiones en px son un snapshot calculado en cada resize. La cadena es:

```
window.resize / ResizeObserver
  → applyViewportCoverage()   ← calcula vw/vh del wrapper
  → setCanvasDPR()            ← lee wrapper.getBoundingClientRect()
  → canvas.style.width/height = displayW/H + 'px'
  → cameraInstance.setViewport(displayW, displayH)
  → overlay.resize(displayW, displayH)
```

### Reglas actuales de viewport

| Dimensión | Comportamiento |
|---|---|
| **Ancho** | Siempre `window.innerWidth` — ocupa el 100% del viewport horizontal |
| **Alto** | Siempre `window.innerHeight` — ocupa el 100% del viewport vertical |
| **fill-scale** | Variable CSS `--fill-scale` que solo afecta el `transform: scale()` visual de `.novela.full-bleed` |
| **coverage** | Parámetro `?scale=` que históricamente reducía ambas dimensiones; actualmente solo afecta el alto (deprecated) |

### CSS crítico del layout

```css
#mapa-canvas-wrapper {
  position: relative;
  margin: 0 auto;
  display: block;
}

.novela.full-bleed {
  width: 100%;
  height: 100%;
  transform: scale(var(--fill-scale));
  transform-origin: top center;
}

#main-content {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  width: 100%;
  height: 100%;
}
```

### Debug del layout

```js
const w = document.getElementById('mapa-canvas-wrapper');
console.log(w.getBoundingClientRect());
console.log(getComputedStyle(w).margin);

window.LayoutFill.get(); // → ej: 98.0
window.LayoutFill.set(100); // 100 = sin reducción
```

---

## 14. Waypoint Info Box

Caja de texto flotante que se muestra sobre el canvas en la esquina superior izquierda al navegar entre waypoints. Muestra el título y la primera línea descriptiva del waypoint activo.

### Cómo funciona

- Es un `<div id="waypoint-info-box">` con `position: absolute; top: 0` dentro del `#mapa-canvas-wrapper` — flota encima del canvas sin afectar el layout (igual que los botones de fase abajo).
- Se actualiza automáticamente en cada `goToWaypoint()`.
- Lee `wp.label` como título y `wp.lines[0]` como descripción desde el JSON del mapa.
- Si el waypoint no tiene ni `label` ni `lines`, la caja se oculta.

### Personalizar el contenido por waypoint

Editar directamente en el JSON del mapa correspondiente:

```json
{
  "id": "wp_f1_col1",
  "label": "Título del waypoint",
  "lines": [
    "Descripción que aparece en la caja flotante.",
    "Segunda línea (usada en el sistema de diálogo interno, no en la caja)."
  ]
}
```

Los archivos a editar son `mapa_f1.json`, `mapa_f2.json` y `mapa_f3.json` dentro de la historia activa (`public/data/stories/{id}/maps/`). Los `TODO` actuales son placeholders listos para reemplazar.

### Estructura HTML

```html
<!-- Dentro de #mapa-canvas-wrapper, antes de #overlay-layer -->
<div id="waypoint-info-box" class="waypoint-info-box" aria-live="polite" hidden>
  <h3 id="waypoint-info-title" class="waypoint-info-box__title"></h3>
  <p  id="waypoint-info-desc"  class="waypoint-info-box__desc"></p>
</div>
```

### Estilos clave

```css
.waypoint-info-box {
  position: absolute; /* flota, no empuja */
  top: 0;
  left: 0;
  right: 0;
  z-index: 9990;
  pointer-events: none; /* no interfiere con clicks al mapa */
  background: rgba(10, 18, 26, 0.85);
  backdrop-filter: blur(12px);
}

/* Desktop: ancho limitado para no tapar el mapa */
@media (min-width: 900px) {
  .waypoint-info-box {
    max-width: min(560px, 45%);
  }
}
```

---

## 15. Optimizaciones de performance implementadas

> Baseline: **Lighthouse 100** (Rendimiento) en Moto G Power emulado, 4G lenta — Mayo 2026.

| Optimización | Descripción |
|---|---|
| **createImageBitmap** | La imagen del mapa se decodifica fuera del main thread via `fetch() + createImageBitmap()`. Elimina ~2s de blocking. Fallback a `new Image()` si no hay soporte. |
| **Bundle de hotspots** | `icons.json` combina todos los `wp*.json` en 1 request vs 12. Reduce la ruta crítica ~400–500ms. Fallback automático a archivos individuales. |
| **CSS non-blocking** | `style.css` y `popup_styles.css` cargan con `media="print" onload="this.media='all'"`. Ahorra ~300ms de render-blocking. |
| **Dirty flag system** | El canvas solo se redibuja cuando alguna capa está marcada como sucia. En reposo: 0 redraws/s. |
| **Spatial index** | WaypointSpatialIndex con grid de celdas para culling O(1). Se activa con >15 waypoints. |
| **Viewport culling** | Overlays y waypoints fuera del viewport no se renderizan. |
| **WebP automático** | MapManager detecta soporte WebP y sirve el formato óptimo con fallback a JPG. |
| **OffscreenCanvas** | Íconos pequeños se pre-renderizan en OffscreenCanvas para evitar re-decode en cada frame. |
| **Lazy loading de mapas** | Los JSON de mapas se fetchean solo cuando se navega a esa fase. Se cachean en memoria. |
| **Preload de fase siguiente** | Al cargar una fase, la siguiente se pre-carga en background. |
| **Memory monitor** | Muestrea uso de heap. Si supera 85% activa warnings. |
| **DPR limitado** | devicePixelRatio máximo: 1.6 desktop, 1.5 mobile. Evita canvas gigantes. |
| **Canvas size validation** | Valida y ajusta dimensiones del canvas según `CANVAS_LIMITS` en `config.js`. |
| **Idle FPS throttling** | Cuando no hay animación activa, el loop corre a 30fps en vez de 60fps. |
| **Editor bajo demanda** | `editor.js` solo se carga con `?editor=1`. No está en el bundle de producción. |
| **logicalW/H como fuente de verdad** | `drawImage` escala la imagen al espacio lógico — la resolución física es independiente. Permite imágenes livianas sin mover waypoints. |
| **Guard breathing con popup** | `breathingAllowed` incluye `!popupManager?.isOpen()` — el breathing se pausa mientras el popup está abierto. Evita que el canvas se redibuje innecesariamente cada frame durante la lectura del popup. |
| **Guard resize con popup** | `handleResize`, `ResizeObserver` y `visualViewport.resize` retornan inmediatamente si el popup está abierto. La scrollbar del body al abrir/cerrar popup genera un resize de ~17px que antes disparaba `setCanvasDPR()` causando un flash visible en el canvas. |
| **structuredClone en vez de JSON.parse(JSON.stringify)** | `structuredClone()` es más rápido, preserva tipos y evita el overhead de serialización/parseo. Aplicado en `MapManager.js:684`. |
| **Guard contra null pointer en overlays** | `_onPointerDown` y `_onPointerUp` en `OverlayLayer.js` ahora tienen guards contra items eliminados entre eventos. Previene TypeError en tappings rápidos. |
| **Culling world-space duplicado eliminado** | `endFrame()` en `OverlayLayer.js` hacía dos culling checks (world-space y screen-space). El screen-space es suficiente y más preciso. Se eliminó el bloque world-space (~10 líneas). |
| **Catch con warning en icons bundle** | `_loadSplitIcons()` ahora loguea un `console.warn` si `icons.json` falla. Antes tragaba el error en silencio. |

---

## 16. Pendientes y roadmap

### Pendiente inmediato
- [ ] Contenido real del Expediente 0001 — reemplazar imágenes de prueba y datos de waypoints con el caso real (`label` y `lines` en los JSON de mapas)
- [ ] `thumb.webp` para el catálogo `index.json`
- [ ] Resolver el colapso del iframe en WordPress online (divergentes.com) — guard de altura mínima en el listener
- [ ] Generar imágenes mobile propias para fase 2 y fase 3 (actualmente los 3 mapas usan `mapa-mobile.webp` — logicalW/H ya está unificado a 1400×3181, listo para el reemplazo)

### Corto plazo
- [x] ~~Waypoint Info Box~~ — Caja flotante `position: absolute; top: 0` que muestra `label` y `lines[0]` del waypoint activo. Se actualiza en `goToWaypoint()`. No empuja el layout. (Mayo 2026)
- [ ] Plugin WordPress con shortcode `[mapa_interactivo story="..."]` y panel de ajustes
- [ ] LRU cache para imágenes (límite de ~30 entradas en `imageCache` — hoy crece ilimitado)
- [x] ~~Virtualización de overlays DOM fuera de viewport~~ — Descartado: el culling screen-space existente ya oculta elementos fuera del viewport con precisión de 1px. Para el caso de uso actual (~20 overlays visibles máximo) no hay ganancia medible en implementar virtualización DOM. Si en el futuro un mapa tuviera >100 overlays simultáneos, re-evaluar.

### Mediano plazo
- [ ] Lobby — página que lee `index.json` y muestra tarjetas de historias (activar cuando haya 2+ historias)
- [ ] Segunda historia para validar el sistema multi-historia completo
- [ ] Hotspots con coordenadas proporcionales (`xp/yp`) en vez de `offsetX/offsetY` en píxeles

### Futuro
- [ ] Web Component `<mapa-interactivo>` para distribución sin iframe
- [ ] Panel de administración para editar historias sin tocar JSON
- [ ] Audio/narración sincronizada con waypoints