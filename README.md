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
15. [Fuente única de verdad — Info Box y Popup](#15-fuente-única-de-verdad--info-box-y-popup)
16. [Botones flotantes — Estilo circular](#16-botones-flotantes--estilo-circular)
17. [Optimizaciones de performance implementadas](#17-optimizaciones-de-performance-implementadas)
18. [Pendientes y roadmap](#18-pendientes-y-roadmap)
19. [Sistema de navegación entre fases](#19-sistema-de-navegación-entre-fases)
20. [Bugs resueltos — historial](#20-bugs-resueltos--historial)

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
│   │   ├── mapa-dektop-2x.webp   ← F1 desktop (4240×2049 verificado)
│   │   ├── f2-mapa-dektop-2x.webp← F2 desktop (4240×2049 verificado)
│   │   ├── f3-mapa-dektop-x2.webp← F3 desktop (4240×3815 verificado)
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
│                           ├── mapa_f2.json       ← Copia de f1: desktop idéntico (4240×2050, z:0.85), mobile logicalH:1650 (imagen propia)
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
mapManager.loadStory(url)                      // Carga story.json
mapManager.loadMap(mapId, { setAsCurrent }, goToLast) // Fetch lazy. goToLast=true va al último waypoint.
mapManager.getCurrentPhaseMaps()               // Retorna mapas de la fase activa
mapManager.setPhase(phaseId)                   // Cambia fase y pre-carga la siguiente
mapManager.getNextPhaseId()                    // ID de la fase siguiente (null si es la última)
mapManager.getPrevPhaseId()                    // ID de la fase anterior (null si es la primera)
```

**⚠️ CRÍTICO:** `preloadPhase()` debe pasar `{ setAsCurrent: false }` al llamar `loadMap()`. Sin esto, si F3 termina de precargarse mientras el usuario está en F2, el RAF usa `logicalH=3815` para dibujar F2 — deformación visual. (Ver sección Bugs resueltos)

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
- Usa `createImageBitmap()` para decodificar fuera del main thread

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
Sistema de popups modales con estructura detallada: imagen principal, fecha/hora, ubicación, descripción, barra sticky de personas implicadas (filtro reordenable) y echos agrupados por persona (`buildEchoGroups()` / `promotePerson()`).

### `UIManager.js` — Interfaz de usuario
Renderiza el filtro de fases (botones superiores), el selector de mapas, el drawer lateral mobile y los puntos de progreso.

**Métodos clave:**
```js
uiManager.selectPhase(phaseId, goToLast=false) // Cambia fase; goToLast=true va al último waypoint
uiManager.setNextPhaseHint(show, nextPhaseId)  // Activa/desactiva animación hint en botón de siguiente fase
```

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
    "mobile":  { "src": "/assets/mapa-mobile.webp?v=2026-05-21", "logicalW": 1400, "logicalH": 3181 },
    "desktop": { "src": "/assets/mapa-dektop-2x.webp?v=2026-05-25", "logicalW": 4240, "logicalH": 2049 },
    "useNaturalSize": false
  },
  "waypoints": [
    {
      "mobile":  { "xp": 0.17, "yp": 0.20, "z": 0.9 },
      "desktop": { "xp": 0.18, "yp": 0.21, "z": 1.0 },
      "yOffset": { "default": 0, "tall": -90, "medium": -5, "short": 40 },
      "zMobileProfile": { "default": 0.56, "tall": 0.66, "medium": 0.60, "short": 0.52 },
      "label": "Intro editorial de la fase",
      "lines": ["Descripción que aparece en el info-box.", "Segunda línea opcional."]
    }
  ]
}
```

> **Nota:** `label` y `lines` solo deben estar presentes en el **waypoint 0** (índice 0) de cada mapa. Ver sección 15.

**Dimensiones canónicas — Expediente 0001:**

| Fase | Plataforma | logicalW | logicalH | Imagen física verificada |
|---|---|---|---|---|
| F1 | desktop | 4240 | 2049 | `mapa-dektop-2x.webp` |
| F2 | desktop | 4240 | 2049 | `f2-mapa-dektop-2x.webp` |
| F3 | desktop | 4240 | 3815 | `f3-mapa-dektop-x2.webp` |
| F1 | mobile | 1400 | 1789 | `mapa-mobile-2x.webp` |
| F2 | mobile | 1400 | 1650 | `f2-mapa-mobile-x2.webp` |
| F3 | mobile | 1400 | 3181 | `mapa-mobile.webp` |

**F1 y F2 desktop comparten dimensiones y waypoints** — mismos `xp/yp`, `yOffset`, `zMobileProfile`. Cualquier ajuste en F1 desktop debe replicarse en F2.

### `mapa_f1_icons/icons.json` — Bundle de hotspots

```json
{
  "wp0": [ { "type": "hotspot", "mobile": {...}, "desktop": {...}, "title": "...", "description": "...", "involved": [...], "echos": {...} } ],
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
http://localhost:5173/?story=panama/expedientes/0001&debug=1&popups=1
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

### Paso 1 — Verificar dimensiones reales

```bash
identify public/assets/nueva-imagen.webp
# O en Mac sin ImageMagick:
sips -g pixelWidth -g pixelHeight public/assets/nueva-imagen.webp
```

**⚠️ Nunca escribir `logicalW/H` sin verificar primero.** Un valor incorrecto (aunque sea 1px) hace que la cámara calcule zoom y posición sobre una escala incorrecta — causa deformación visible al cambiar de fase.

### Paso 2 — Actualizar `mapImage` en el JSON

```json
"mapImage": {
  "mobile":  { "src": "/assets/nueva-mobile.webp?v=YYYY-MM-DD", "logicalW": W, "logicalH": H },
  "desktop": { "src": "/assets/nueva-desktop.webp?v=YYYY-MM-DD", "logicalW": W, "logicalH": H }
}
```

El `?v=YYYY-MM-DD` fuerza al browser a no usar la versión cacheada.

### Paso 3 — Sobre los waypoints

Los waypoints usan `xp/yp` normalizados (0.0–1.0). Si la nueva imagen mantiene el mismo `logicalH`, no hay que recalcular nada.

**Solo recalculá si cambiás el `logicalH`:**

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
```

### Debug del layout

```js
const w = document.getElementById('mapa-canvas-wrapper');
console.log(w.getBoundingClientRect());
window.LayoutFill.get(); // → ej: 98.0
window.LayoutFill.set(100); // 100 = sin reducción
```

---

## 14. Waypoint Info Box

Caja de texto flotante que se muestra sobre el canvas en la esquina superior izquierda al navegar entre waypoints. Muestra el título y descripción del waypoint activo.

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
  pointer-events: none;
  background: rgba(10, 18, 26, 0.85);
  backdrop-filter: blur(12px);
}

@media (min-width: 900px) {
  .waypoint-info-box {
    max-width: min(560px, 45%);
  }
}
```

---

## 15. Fuente única de verdad — Info Box y Popup

> **Junio 2026** — Refactorización arquitectural: eliminación de datos duplicados entre `mapa_fN.json` e `icons.json`.

### El principio

El **info-box** y el **popup detallado** muestran la misma información base. El popup agrega implicados, echos e imagen. **No hay dos fuentes de verdad para el mismo contenido.**

```
icons.json (hotspot principal)
  ├── title       → info-box __title  +  popup __title
  ├── description → info-box __desc   +  popup __description
  ├── datetime    → info-box __date   +  popup __date/__time
  ├── involved    →                      popup barra implicados
  └── echos       →                      popup echos por persona
```

### Excepción: waypoint 0 de cada fase (intro editorial)

El primer waypoint de cada fase (`state.idx === 0`) es un texto editorial que introduce la fase — no es el resumen de un evento específico. Vive en `mapa_fN.json` y **no** está en `icons.json`:

```json
// mapa_f1.json → waypoints[0]  ← ÚNICO lugar donde editar la intro
{
  "label": "Regreso y vigilancia: tres días que sellaron el asesinato de Samcam.",
  "lines": [
    "Descripción editorial que aparece en el info-box al entrar a la fase.",
    "Segunda línea opcional (body, tipografía más pequeña)."
  ]
}
```

Los waypoints 1+ **no tienen** `label` ni `lines` en los mapas JSON — esos campos se eliminaron. El info-box los lee directamente de `icons.json`.

### Lógica en `app.js` — `updateWaypointInfoBox()`

```js
const hotspots = state.currentIcons[state.idx] || [];
const mainHotspotForWib = hotspots.find(h => !h.noPopup && h.title);

// wp0: intro editorial desde el mapa JSON
// wp1+: título y descripción desde el hotspot principal de icons.json
const isPhaseIntro = state.idx === 0 && (wp?.label || wp?.lines?.[0]);

const title = isPhaseIntro ? (wp.label || '') : (mainHotspotForWib?.title || '');
const desc  = isPhaseIntro ? (wp?.lines?.[0] || '') : (mainHotspotForWib?.description || '');
const body  = isPhaseIntro ? (wp?.lines?.[1] || '') : '';
```

La fecha dinámica siempre se lee del hotspot (`datetime.date` / `datetime.time`), independientemente de si es intro o no.

### Dónde editar el contenido

| Tipo de waypoint | Qué editar | Archivo |
|---|---|---|
| Waypoint 0 de cada fase | `label` + `lines` | `mapa_f1.json`, `mapa_f2.json`, `mapa_f3.json` |
| Waypoints 1+ | `title` + `description` del hotspot principal | `mapa_f1_icons/icons.json`, `mapa_f2_icons/icons.json`, `mapa_f3_icons/icons.json` |

**Hotspot principal** = primer hotspot del grupo `wpN` que no tiene `noPopup: true` y tiene `title` no vacío.

### Correspondencia wpN ↔ waypoint visual

Los grupos `wp0`, `wp1`, `wp2`... en `icons.json` corresponden al **índice** del waypoint en el array `waypoints[]` del mapa activo.

```
mapa_f1.json → waypoints[0] → icons.json "wp0"
mapa_f1.json → waypoints[1] → icons.json "wp1"
mapa_f1.json → waypoints[2] → icons.json "wp2"
...
```

---

## 16. Botones flotantes — Estilo circular

> **Junio 2026** — Unificación visual: todos los botones flotantes usan `border-radius: 50%`.

Los botones de acción flotantes (hamburger, mosca, about, home) ahora son **círculos completos**, consistentes con el lenguaje visual del resto de la UI.

### Botones afectados

| Selector | Descripción |
|---|---|
| `.hamburger` | Botón de menú lateral |
| `.mosca-btn` | Botón flotante de acción rápida |
| `.about-btn` | Botón de información |
| `.home-btn` | Botón de inicio (desktop y mobile) |

### CSS aplicado

```css
/* Antes: border-radius: 12px (cuadrado redondeado) */
/* Después: border-radius: 50% (círculo) */

.hamburger   { border-radius: 50%; }
.mosca-btn   { border-radius: 50%; }
.about-btn   { border-radius: 50%; }
.home-btn    { border-radius: 50%; }

@media (max-width: 520px) {
  .home-btn  { border-radius: 50%; } /* mobile también */
}
```

Todos los demás atributos (tamaño, fondo, sombra, hover) permanecen sin cambios. Solo el `border-radius` fue modificado.

---

## 17. Optimizaciones de performance implementadas

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
| **logicalW/H como fuente de verdad** | `drawImage` escala la imagen al espacio lógico — la resolución física es independiente. |
| **Guard breathing con popup** | `breathingAllowed` incluye `!popupManager?.isOpen()` — el breathing se pausa mientras el popup está abierto. |
| **Guard resize con popup** | `handleResize`, `ResizeObserver` y `visualViewport.resize` retornan inmediatamente si el popup está abierto. |
| **structuredClone** | Reemplaza `JSON.parse(JSON.stringify)` — más rápido y preserva tipos. Aplicado en `MapManager.js:684`. |
| **Guard null pointer en overlays** | `_onPointerDown` y `_onPointerUp` tienen guards contra items eliminados entre eventos. |
| **Culling world-space eliminado** | `endFrame()` en `OverlayLayer.js` hacía doble culling. Se eliminó el bloque world-space redundante. |
| **Catch con warning en icons bundle** | `_loadSplitIcons()` loguea `console.warn` si `icons.json` falla. Antes tragaba el error en silencio. |
| **Fuente única de verdad (Info Box)** | Info-box y popup leen del mismo hotspot en `icons.json`. Elimina duplicación de `label`/`lines` en los mapas JSON para waypoints 1+. |

---

## 18. Pendientes y roadmap

### Pendiente inmediato
- [x] ~~Contenido real F1/F2/F3~~ — textos reales + pasada de tono/legal aplicada (Junio 2026)
- [x] ~~Hotspots conectados a personas reales~~ — `involved`/`echos` completos en F1/F2/F3 (Junio 2026)
- [x] ~~Fuente única de verdad info-box~~ — `updateWaypointInfoBox` lee de `icons.json`; wp0 de cada fase conserva intro editorial en mapa JSON (Junio 2026)
- [x] ~~Botones flotantes circulares~~ — `border-radius: 50%` en `.hamburger`, `.mosca-btn`, `.about-btn`, `.home-btn` (Junio 2026)
- [ ] 25 imágenes nuevas + 4 referencias a avatares existentes para hotspots tipo B
- [ ] `thumb.webp` para el catálogo `index.json`
- [ ] Resolver el colapso del iframe en WordPress online — guard de altura mínima en el listener
- [x] ~~Imagen mobile propia para fase 2~~ — `f2-mapa-mobile-x2.webp` (1400×1650)
- [x] ~~Fix race condition cambio de fase~~ — transición en vuelo + preload sobreescribiendo currentMap (Junio 2026)
- [x] ~~Fix logicalH incorrecto~~ — F1: 2050→2049, F2: 1773→2049 verificados con `identify` (Junio 2026)
- [x] ~~Transiciones entre fases~~ — fade negro con `.phase-transition-overlay` (Junio 2026)
- [x] ~~Navegación continua entre fases~~ — siguiente en último waypoint avanza fase, atrás en waypoint 0 regresa (Junio 2026)
- [x] ~~Brief de cierre~~ — popup con línea de tiempo al terminar última fase (Junio 2026)
- [x] ~~Minimap desactivado~~ — `SHOW_MINIMAP: false` en config.js (Junio 2026)

### Corto plazo
- [ ] Plugin WordPress con shortcode `[mapa_interactivo story="..."]` y panel de ajustes
- [ ] LRU cache para imágenes (límite de ~30 entradas en `imageCache` — hoy crece ilimitado)

### Mediano plazo
- [ ] Lobby — página que lee `index.json` y muestra tarjetas de historias (activar cuando haya 2+ historias)
- [ ] Segunda historia para validar el sistema multi-historia completo
- [ ] Hotspots con coordenadas proporcionales (`xp/yp`) en vez de `offsetX/offsetY` en píxeles

### Futuro
- [ ] Web Component `<mapa-interactivo>` para distribución sin iframe
- [ ] Panel de administración para editar historias sin tocar JSON
- [ ] Audio/narración sincronizada con waypoints

---

## 19. Sistema de navegación entre fases (Junio 2026)

### Flujo completo

```
Fase 1, waypoint 0 → ... → Fase 1, waypoint N (último)
  ↓ click "siguiente"
  → uiManager.selectPhase('fase2')
  → _fadePhase(): pantalla negra 550ms → loadMap(mapa_f2, goToLast=false) → fade out
  → Fase 2, waypoint 0

Fase 2, waypoint 0
  ↓ click "anterior"
  → mapManager.getPrevPhaseId() → 'fase1'
  → uiManager.selectPhase('fase1', goToLast=true)
  → _fadePhase(): pantalla negra → loadMap(mapa_f1, goToLast=true)
  → goToWaypoint(waypoints.length - 1)
  → Fase 1, último waypoint

Fase 3, último waypoint
  ↓ click "siguiente"
  → mapManager.getNextPhaseId() → null (última fase)
  → showBrief({ html: CLOSING_BRIEF_HTML, btnLabel: '← Inicio' })
  ↓ click "← Inicio"
  → location.reload() → intro
```

### Hint visual en botón de siguiente fase

Al llegar al último waypoint de una fase, el botón de la siguiente fase recibe `.is-hinting`:
- `::after` con `conic-gradient` rotando (2.2s, compositor GPU)
- Se desactiva al navegar hacia atrás
- En la última fase no aparece nada (`getNextPhaseId()` devuelve `null`)
- Respeta `prefers-reduced-motion` con glow estático

### Brief de cierre

`CLOSING_BRIEF_HTML` es una constante en `app.js` con la línea de tiempo de las pesquisas en HTML. Para actualizar el contenido editorial buscar `const CLOSING_BRIEF_HTML` en `app.js`.

### Transición `_fadePhase()`

```js
async function _fadePhase(fn) {
  phaseOverlay.classList.add('is-entering');   // fade a negro (0.55s)
  await new Promise(r => setTimeout(r, 550));
  await fn();                                   // carga el mapa
  phaseOverlay.classList.remove('is-entering'); // fade out del negro
}
```

El overlay `.phase-transition-overlay` tiene `z-index: 150` — sobre canvas y overlays DOM, bajo intro (200) y brief (210).

---

## 20. Bugs resueltos — historial

### Race condition en cambio de fase (Junio 2026)

**Síntoma:** F2 se veía deformada la primera vez. F3→F2 se veía bien.

**Bug 1 — Transición en vuelo:** `transitionState.active` permanecía `true` con `targetPos` de F1 cuando el usuario hacía click en F2 durante una transición. El RAF sobreescribía `camTarget` de vuelta a F1.
**Fix:** `transitionState.active = false` antes de `goToWaypoint(0)` en `loadMap()`.

**Bug 2 — Preload sobreescribía currentMap:** `preloadPhase()` llamaba `loadMap()` que siempre asignaba `this.currentMap`. Si F3 terminaba de precargarse mientras el usuario estaba en F2, el RAF usaba `logicalH=3815` para dibujar F2.
**Fix:** `loadMap()` acepta `{ setAsCurrent }`. `preloadPhase()` pasa `{ setAsCurrent: false }`.

**Verificación Playwright:** Primera y segunda carga de F2 producen `{x:750, y:~680}`. Antes: `{x:2116, y:1570}`.

### logicalH incorrecto en JSON de mapas (Junio 2026)

F2 tenía `logicalH: 1773` cuando la imagen real mide 2049px (13% de error). F1 tenía `logicalH: 2050` (1px). Corregidos tras verificar con `identify`. Regla permanente: siempre verificar con `identify` antes de escribir `logicalH`.

### Glitch al cerrar popup (Junio 2026)

`closeAll()` llamaba `setCanvasDPR()` + `markDirty()` asumiendo que la scrollbar del body cambiaría. Como `body { overflow: hidden }` es permanente, esas llamadas producían un resize innecesario con flash visible. Se eliminaron.

### Datos duplicados info-box / popup (Junio 2026)

`label` y `lines` en los mapas JSON duplicaban `title` y `description` de los hotspots en `icons.json`. Se refactorizó `updateWaypointInfoBox()` para leer directamente de `icons.json` en waypoints 1+. Se eliminaron `label`/`lines` de todos los waypoints ≥ 1 en los 3 mapas. Ver sección 15.
