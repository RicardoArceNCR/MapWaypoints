// ============================================================================
// config.commented.js
// Archivo de configuración con COMENTARIOS explicando la función de cada bloque
// y dónde aparece cada dato en la interfaz.
// ----------------------------------------------------------------------------
// DÓNDE SE USA:
// - PHASES:   Construye la barra de fases (tabs) y colorea el HUD.
// - MAPS:     Cada fase lista 1+ mapas. Cada mapa define la imagen base (mobile/desktop),
//             su set de waypoints (puntos de cámara) y los "icons" (hotspots/áreas clicables).
// - WAYPOINTS: Ajustan cámara y textos (label/lines) del HUD/diálogo.
// - ICONS:    Hotspots que se dibujan encima del mapa. En debug se ven rectángulos
//             y coordenadas; al tocar/clicar, se abre el popup detallado (si existe).
// - WAYPOINT_POPUPS: Contenido del botón flotante “Ver Ubicación” (si el wp lo tiene).
//
// Mobile vs Desktop:
// - Para cada hotspot tienes dos layouts: `mobile{...}` y `desktop{...}`. Se elige
//   en runtime según el breakpoint (GLOBAL_CONFIG.MOBILE_BREAKPOINT).
//
// Coordenadas y medidas de hotspots:
// - offsetX / offsetY: desplazamientos relativos al centro del waypoint (en px lógicos
//   sobre la imagen base del mapa).
// - width / height: tamaño del hotspot (px lógicos).
// - rotation: rotación en grados del rectángulo (opcional).
// - radius: radio de borde para hotspot “redondeado” (opcional).
// ============================================================================


// ========= CONFIG FASES =========
// Aparece en la barra superior de fases (pestañas). `maps` enlaza con las claves de MAPS_CONFIG.
export const PHASES = [
  { id: 'fase1', label: 'Fase 1', color: '#1BC6EB', maps: ['mapa_f1'] },
  { id: 'fase2', label: 'Fase 2', color: '#FF6B6B', maps: ['mapa_f2'] },
  { id: 'fase3', label: 'Fase 3', color: '#4ECDC4', maps: ['mapa_f3'] },
];


// ========= CONFIGURACIÓN DE POPUPS POR WAYPOINT =========
// Contenido del botón flotante por waypoint (si tu UI lo muestra).
// Donde lo ves: botón “Ver Ubicación” (o el texto que pongas en buttonText).
export const WAYPOINT_POPUPS = {
  // key numérica = índice del waypoint dentro de `map.waypoints`
  0: {
    title: 'Punto de inicio',          // Título grande del popup
    subtitle: 'Bienvenida y contexto', // Subtítulo
    image: '/assets/popups/inicio.webp', // Imagen que se muestra dentro del popup
    buttonText: 'Empezar aquí',        // Texto del botón principal
    icon: '🚀'                          // Emoji/ícono del botón
  },
  1: {
    title: 'Zona de espera',
    subtitle: 'Área de abordaje',
    image: '/assets/popups/zona-espera.webp',
    buttonText: 'Ver zona',
    icon: '⏳'
  },
  2: {
    title: 'Zona residencial',
    subtitle: 'Encuentro con el conductor',
    image: '/assets/popups/residencial.webp',
    buttonText: 'Detalles',
    icon: '🏠'
  },
  3: {
    title: 'Parada intermedia',
    subtitle: 'Ubicación clave',
    image: '/assets/popups/parada.webp',
    buttonText: 'Ver parada',
    icon: '🅿️'
  },
  4: {
    title: 'Destino final',
    subtitle: 'Llegada al punto de interés',
    image: '/assets/popups/destino.webp',
    buttonText: 'Llegada',
    icon: '🏁'
  }
  // Puedes seguir agregando más índices si tienes más waypoints.
};


// ========= MAPAS POR FASE =========
// Cada entrada define un "mapa" (imagen base + waypoints + hotspots/icons).
export const MAPS_CONFIG = {

  // --------------------------------------------------------------------------
  // MAPA FASE 1
  // --------------------------------------------------------------------------
  mapa_f1: {
    id: 'mapa_f1',                // Identificador interno
    name: 'Recorrido 1',          // Nombre visible (si lo usas)
    phase: 'fase1',               // Vincula con PHASES[id]
    mapImage: {
      // Imagen base en MÓVIL (se usa cuando viewport <= MOBILE_BREAKPOINT)
      mobile: {
        src: '/assets/mapa-mobile.webp', // Ruta de la imagen
        logicalW: 2338,                   // Ancho lógico de referencia de esa imagen
        logicalH: 2779                    // Alto lógico de referencia de esa imagen
      },
      // Imagen base en DESKTOP
      desktop: {
        src: '/assets/mapa-dektop.webp',
        logicalW: 2858,
        logicalH: 1761
      },
      useNaturalSize: false // Si true, usa tamaños naturales de la imagen en vez de logicalW/H
    },

    // WAYPOINTS = puntos de cámara.
    // Dónde aparecen:
    // - Cambian la posición/zoom de cámara (xp, yp, z).
    // - `label` y `lines` se muestran en el HUD/diálogo (si SHOW_DIALOGS está activo).
    waypoints: [
      { 
        mobile:  { xp: 0.13, yp: 0.23, z: 0.90 }, // coords normalizadas 0..1 sobre la imagen base móvil
        desktop: { xp: 0.299, yp: 0.26, z: 0.80 },// coords normalizadas 0..1 sobre la imagen base desktop
        label: 'Inicio del Viaje',
        lines: [
          'Aquí comienza la historia. Un punto de partida crucial que marca el inicio de esta aventura.',
          'Los detalles de este momento son fundamentales para entender todo lo que viene después.'
        ]
      },
      { 
        mobile:  { xp: 0.47, yp: 0.23, z: 0.90 },
        desktop: { xp: 0.750, yp: 0.25, z: 0.91 },
        label: 'Punto Central',
        lines: [
          'En el corazón del territorio encontramos este lugar estratégico.',
          'Desde aquí se pueden observar todos los acontecimientos importantes.'
        ]
      },
      { 
        mobile:  { xp: 0.80, yp: 0.23, z: 0.90 },
        desktop: { xp: 0.26, yp: 0.75, z: 0.91 },
        label: 'Momento Culminante',
        lines: [
          'Este es el punto donde todo cambia. Un momento decisivo en la narrativa.',
          'Los eventos que ocurren aquí tienen consecuencias duraderas.'
        ]
      },
      { 
        mobile:  { xp: 0.13, yp: 0.70, z: 0.90 },
        desktop: { xp: 0.750, yp: 0.75, z: 0.91 },
        label: 'Momento Culminante',
        lines: [
          'Este es el punto donde todo cambia. Un momento decisivo en la narrativa.',
          'Los eventos que ocurren aquí tienen consecuencias duraderas.'
        ]
      },
      { 
        mobile:  { xp: 0.47, yp: 0.70, z: 0.90 },
        desktop: { xp: 0.26, yp: 1.20, z: 0.91 }, // Nota: yp>1 se verá solo si permites desplazamiento/letterbox
        label: 'Momento Culminanteeeee',
        lines: [
          'Este es el punto donde eeeeeeeeeeeetodo cambia. Un momento decisivo en la narrativa.',
          'Los eventos que ocurren aquí tienen consecuencias duraderas.'
        ]
      },
      { 
        mobile:  { xp: 0.82, yp: 0.70, z: 0.30 },
        desktop: { xp: 0.725, yp: 1.25, z: 0.91 }, // Igual: yp>1 fuera del marco estándar
        label: 'mmmmmMomento Culminanteeeee',
        lines: [
          'Este esu748484484884 el punto donde eeeeeeeeeeeetodo cambia. Un momento decisivo en la narrativa.',
          'Los eventos que ocurren aquí tienen consecuencias duraderas.'
        ]
      }
    ],

    // ICONS = Hotspots por waypoint.
    // Estructura:
    //   icons: {
    //     [waypointIndex]: [ { hotspot1 }, { hotspot2 }, ... ]
    //   }
    // Dónde aparecen:
    // - Se dibujan sobre el mapa (rectángulos/áreas). En debug se ven con borde y label #n.
    // - Al tocar/clicar, disparan lógica de popup detallado (si existe título/imagen/etc.)
    icons: {
      // =============== Waypoint 0 ===============
      0: [
        {
          // ----- Hotspot 0 (comentado a fondo; los demás siguen mismo patrón) -----
          type: 'hotspot', // "hotspot" (área interactiva grande) o "icon" (botón pequeño)
          // Layout para MÓVIL:
          mobile:  { offsetX: 33, offsetY: -25, width: 290, height: 176, rotation: 0 },
          // Layout para DESKTOP:
          desktop: { offsetX: -464, offsetY: -55, width: 397, height: 218, rotation: -10 },

          // Metadatos que el Popup/Detalle usa al abrirse tras el click/tap:
          title: 'Llegada al Aeropuerto',   // Título del popup
          image: '/assets/mapa-1.webp',     // Imagen grande del evento
          datetime: {                       // Fechas/horas mostradas en la tarjeta/popup
            date: '15/06/2025',
            time: '12:07',
            timeColor: '#FF4444'
          },
          location: 'Aeropuerto Juan Santamaría (SJO), Alajuela.', // Texto de ubicación
          description:
            'Roberto Danilo Samcam Ruiz regresa a Costa Rica desde México. ... Naranjo González.',

          // Fichas de personas involucradas (se renderizan en el popup con avatar/rol)
          involved: [
            { id: 'person1', name: 'Persona #1', avatar: './assets/persona_1-1.png', role: 'Pasajero' },
            { id: 'person2', name: 'Persona #2', avatar: './assets/persona_1-2.png', role: 'Conductor', highlighted: true },
            { id: 'person3', name: 'Persona #3', avatar: './assets/persona_1-3.png', role: 'Testigo' }
          ],

          // "Ecos" (línea de tiempo asociada a una persona seleccionada en el popup)
          // Se muestran cuando el usuario selecciona la ficha de esa persona.
          echos: {
            person2: [
              { datetime: { date: '15/06/2025', time: '12:07' }, description: 'Regreso a CR...' },
              { datetime: { date: '15/06/2025', time: '14:30' }, description: 'Segunda interacción...' }
            ],
            person1: [
              { datetime: { date: '15/06/2025', time: '11:45' }, description: 'Arribo del vuelo...' }
            ],
            person3: [
              { datetime: { date: '15/06/2025', time: '12:10' }, description: 'Observación del abordaje...' }
            ]
          }
        },

        // Hotspot 1 (misma estructura; otros textos/medidas)
        {
          type: 'hotspot',
          mobile:  { offsetX: 62, offsetY: 339, width: 350, height: 230, rotation: 0, radius: 0 },
          desktop: { offsetX: -115, offsetY: -101, width: 150, height: 156, rotation: 25 },
          title: 'Encuentro en Zona Residencial',
          image: '/assets/mapa-1.webp',
          datetime: { date: '16/06/2025', time: '18:45', timeColor: '#FF4444' },
          location: 'Barrio Escalante, San José.',
          description: 'Segundo encuentro en zona residencial...',
          involved: [
            { id: 'person4', name: 'Persona #4', avatar: './assets/persona_1-4.png', role: 'Contacto principal' },
            { id: 'person5', name: 'Persona #5', avatar: './assets/persona_1-1.png', role: 'Acompañante', highlighted: true },
            { id: 'person6', name: 'Persona #6', avatar: './assets/persona_1-2.png', role: 'Tercero presente' },
            { id: 'person7', name: 'Persona #7', avatar: './assets/persona_1-3.png', role: 'Observador' }
          ],
          echos: {
            person4: [
              { datetime: { date: '16/06/2025', time: '18:30' }, description: 'Llegada al establecimiento...' },
              { datetime: { date: '16/06/2025', time: '19:00' }, description: 'Salida hacia vehículo...' }
            ],
            person5: [
              { datetime: { date: '16/06/2025', time: '18:45' }, description: 'Ingresa 5 min después...' },
              { datetime: { date: '16/06/2025', time: '19:05' }, description: 'Permanece en el lugar...' }
            ],
            person6: [ { datetime: { date: '16/06/2025', time: '18:50' }, description: 'Participa brevemente...' } ],
            person7: [ { datetime: { date: '16/06/2025', time: '18:40' }, description: 'Se mantiene en inmediaciones...' } ]
          }
        },

        // Hotspot 2 (ejemplo corto)
        {
          type: 'hotspot',
          mobile:  { offsetX: -81, offsetY: -320, width: 120, height: 120, rotation: 0, radius: 30 },
          desktop: { offsetX: 241,  offsetY: -61,  width: 397, height: 228, rotation: 25, radius: 10 },
          title: 'Documento',
          body:  'Un documento importante encontrado en esta ubicación.'
        },

        // Hotspot 3 (ejemplo corto)
        {
          type: 'hotspot',
          mobile:  { offsetX: -130, offsetY: 650, width: 120, height: 120, rotation: 0, radius: 20 },
          desktop: { offsetX: -111,  offsetY: 143, width: 149, height: 153, rotation: 0, radius: 10 },
          title: 'Contexto Geográfico',
          body:  'Detalles del entorno que influyen en los acontecimientos.'
        }
      ],

      // =============== Waypoint 1 ===============
      // Nota: estructura idéntica a `icons[0]`. Aquí clonaste narrativas del primer WP
      // y adaptaste posiciones/tamaños. El popup renderiza igual.
      1: [
        {
          type: 'hotspot',
          mobile:  { offsetX: -100, offsetY: -100, width: 136, height: 136, rotation: 0 },
          desktop: { offsetX:  -90, offsetY:  -90, width: 136, height: 136, rotation: 0 },
          title: 'Llegada al Aeropuerto',
          image: '/assets/mapa-1.webp',
          datetime: { date: '15/06/2025', time: '12:07', timeColor: '#FF4444' },
          location: 'Aeropuerto Juan Santamaría (SJO), Alajuela.',
          description: 'Narrativa clonada del WP0-0.',
          involved: [
            { id: 'person1', name: 'Persona #1', avatar: './assets/persona_1-1.png', role: 'Pasajero' },
            { id: 'person2', name: 'Persona #2', avatar: './assets/persona_1-2.png', role: 'Conductor', highlighted: true },
            { id: 'person3', name: 'Persona #3', avatar: './assets/persona_1-3.png', role: 'Testigo' }
          ],
          echos: {
            person2: [
              { datetime: { date: '15/06/2025', time: '12:07' }, description: 'Regreso a CR...' },
              { datetime: { date: '15/06/2025', time: '14:30' }, description: 'Segunda interacción...' }
            ],
            person1: [ { datetime: { date: '15/06/2025', time: '11:45' }, description: 'Arribo del vuelo...' } ],
            person3: [ { datetime: { date: '15/06/2025', time: '12:10' }, description: 'Observación del abordaje...' } ]
          }
        },
        {
          type: 'hotspot',
          mobile:  { offsetX: 160, offsetY: -80, width: 136, height: 136, rotation: 0 },
          desktop: { offsetX:  90,  offsetY: -90, width: 136, height: 136, rotation: 0 },
          title: 'Encuentro en Zona Residencial',
          image: '/assets/mapa-1.webp',
          datetime: { date: '16/06/2025', time: '18:45', timeColor: '#FF4444' },
          location: 'Barrio Escalante, San José.',
          description: 'Narrativa clonada del WP0-1.',
          involved: [
            { id: 'person4', name: 'Persona #4', avatar: './assets/persona_1-4.png', role: 'Contacto principal' },
            { id: 'person5', name: 'Persona #5', avatar: './assets/persona_1-1.png', role: 'Acompañante', highlighted: true },
            { id: 'person6', name: 'Persona #6', avatar: './assets/persona_1-2.png', role: 'Tercero presente' },
            { id: 'person7', name: 'Persona #7', avatar: './assets/persona_1-3.png', role: 'Observador' }
          ],
          echos: {
            person4: [
              { datetime: { date: '16/06/2025', time: '18:30' }, description: 'Llegada...' },
              { datetime: { date: '16/06/2025', time: '19:00' }, description: 'Salida...' }
            ],
            person5: [
              { datetime: { date: '16/06/2025', time: '18:45' }, description: 'Ingresa después...' },
              { datetime: { date: '16/06/2025', time: '19:05' }, description: 'Permanece...' }
            ],
            person6: [ { datetime: { date: '16/06/2025', time: '18:50' }, description: 'Participa...' } ],
            person7: [ { datetime: { date: '16/06/2025', time: '18:40' }, description: 'Se mantiene...' } ]
          }
        },
        // Hotspot 2 & 3 (resumen)
        {
          type: 'hotspot',
          mobile:  { offsetX: -60, offsetY: 180, width: 136, height: 136, rotation: 0 },
          desktop: { offsetX:  -90, offsetY:  90, width: 136, height: 136, rotation: 0 },
          title: 'Elementos Descubiertos',
          image: '/assets/mapa-1.webp',
          datetime: { date: '15/06/2025', time: '12:07', timeColor: '#FF4444' },
          location: '—',
          description: 'Nuevos objetos y recursos encontrados…',
          involved: [],
          echos: {}
        },
        {
          type: 'hotspot',
          mobile:  { offsetX: 160, offsetY: 180, width: 136, height: 136, rotation: 0 },
          desktop: { offsetX:  90,  offsetY:  90, width: 136, height: 136, rotation: 0 },
          title: 'Zona Estratégica',
          image: '/assets/mapa-1.webp',
          datetime: { date: '15/06/2025', time: '12:07', timeColor: '#FF4444' },
          location: '—',
          description: 'Importancia táctica del terreno…',
          involved: [],
          echos: {}
        }
      ],

      // Waypoints 2..5: siguen el mismo patrón. (En tu archivo están definidos con 4
      // items cada uno; algunos usan type:'icon' en vez de 'hotspot', pero la lógica
      // de layout y click es la misma.)
      2: [ /* ...4 hotspots... */ ],
      3: [ /* ...4 hotspots... */ ],
      4: [ /* ...4 icons...    */ ],
      5: [ /* ...4 icons...    */ ]
    }
  },


  // --------------------------------------------------------------------------
  // MAPA FASE 2 (misma estructura que mapa_f1; cambian imágenes, wps y hotspots)
  // --------------------------------------------------------------------------
  mapa_f2: { /* ...tu contenido actual sin cambios, aplica todo lo explicado... */ },

  // --------------------------------------------------------------------------
  // MAPA FASE 3 (misma estructura)
  // --------------------------------------------------------------------------
  mapa_f3: { /* ...tu contenido actual sin cambios, aplica todo lo explicado... */ }
};


// ========= CONFIG GLOBAL =========
// Ajustes de render, performance, depuración y comportamiento general.
// Dónde impacta:
// - Debug overlays (grillas, coords, HUD).
// - Efectos de cámara (transiciones/breathing).
// - Límites y optimizaciones mobile/desktop.
export const GLOBAL_CONFIG = {
  // Mostrar/ocultar elementos de UI globales
  SHOW_DIALOGS: false,   // Muestra el cuadro de diálogo/lines del waypoint
  SHOW_CONTROLS: true,   // Flechas prev/next y progreso

  // Estilos visuales de hotspots en debug
  ICON_STYLES: {
    showBackground: true,
    backgroundColor: 'rgba(0, 209, 255, .18)',
    borderColor: 'rgba(255,255,255,.55)',
    borderWidth: 3,
    debugFill: 'rgba(255,0,0,0.12)'
  },

  // Zona de toque
  TOUCH: {
    mobileMin: 44,     // ancho/alto mínimo para accesibilidad en mobile
    desktopMin: 40,
    hitSlop: 2         // margen invisible para facilitar el click
  },

  // Efectos de cámara (transición entre waypoints y “breathing”)
  CAMERA_EFFECTS: {
    breathingEnabled: false,
    breathingMobileEnabled: false,
    breathingAmount: 9.5,
    breathingSpeed: 0.0009,
    breathingZAmount: 0.0009,

    transitionEnabled: true,
    transitionDuration: 1200,
    transitionZoomOut: 0.25,
    transitionEasing: 'ease-in-out',
    disableBreathingDuringTransition: true
  },

  // Límites de canvas y guardias de viewport (evitan deformaciones y OOM)
  CANVAS_LIMITS: {
    desktop: { maxWidth: 4096, maxHeight: 4096, maxPixels: 12_000_000, maxMemoryMB: 150 },
    mobile:  { maxWidth: 2048, maxHeight: 4500, maxPixels:  8_000_000, maxMemoryMB: 100 },
    downscaleFactor: 0.8,
    warnThreshold: 0.85
  },
  VIEWPORT_GUARDS: {
    desktop: { clampBelowW: 1183, hardCutBelowW: 900 },
    mobile:  { minH: 606 }
  },
  BASE_ASPECT: 1280/720, // Relación base para cálculos de contain/cover

  // Culling y spatial index para muchos waypoints
  WAYPOINT_RENDERING: {
    enableCulling: true,
    cullingMargin: 300,
    maxVisibleWaypoints: 20,
    useSpatialIndex: true,
    spatialIndexThreshold: 15,
    cellSize: 500
  },

  // Gestión de memoria (caches por fase)
  MEMORY_MANAGEMENT: {
    maxActivePhaseCaches: 1,
    autoCleanInactivePhases: true,
    unloadAfterPhaseChange: true,
    forceClearCache: true,
    logMemoryUsage: true
  },

  // Optimizaciones en mobile (DPR, FPS, transiciones simplificadas)
  MOBILE_OPTIMIZATIONS: {
    maxDPR: 1.5,
    disableBreathingOnLowEnd: true,
    reduceTransitionQuality: true,
    targetFPS: 45,
    aggressiveCulling: true
  },

  // Bloque de tamaños “lockItemWidthToScreenPx” (si quieres ancho fijo de hotspot)
  RESPONSIVE_SIZING: {
    mobile:  { lockItemWidthToScreenPx: false },
    desktop: { lockItemWidthToScreenPx: false }
  },

  // Snap del overlay a la malla (perdón de alineación)
  OVERLAY_SNAP_RADIUS: { mobile: 0, desktop: 24 },

  // Flags de depuración
  DEBUG_HOTSPOTS: true,
  SHOW_POPUP_ON_CLICK: true,
  DEBUG_SHOW_GRID: true,
  DEBUG_SHOW_COORDS: true,
  DEBUG_SHOW_MINIMAP_MOBILE: false,
  DEBUG_SHOW_WAYPOINT_LABELS: false,
  DEBUG_SHOW_MEMORY_STATS: true,
  DEBUG_SHOW_WAYPOINT_HUD: true,

  // Dibujo de hotspots en el canvas (modo editor)
  DRAW_HOTSPOTS_ON_CANVAS: true,
  SYNC_OVERLAYS_WITH_EDITOR: true,
  CANVAS_HOTSPOT_STYLES: {
    fill: 'rgba(0, 209, 255, 0.1)',
    stroke: 'rgba(0, 209, 255, 0.5)',
    lineWidth: 1,
    activeFill: 'rgba(0, 209, 255, 0.2)',
    activeStroke: 'rgba(255, 255, 255, 0.8)'
  },

  // Ajustes varios
  WAYPOINT_OFFSET: { mobile: 0, desktop: 0 },
  BASE_W: 1280, BASE_H: 720,
  TYPE_SPEED: 18, EASE: 0.08,
  MARKER_R: 8, ICON_R: 18, ICON_SIZE: 36,
  DPR_MAX: 2,
  MOBILE_BREAKPOINT: 900,
  CANVAS_MIN_HEIGHT: 720,

  // Estilos del cuadro de diálogo (si SHOW_DIALOGS = true)
  DIALOG_BOX: {
    x: 16, y: 720 - 220, w: 1280 - 32, h: 180,
    bg: 'rgba(0,0,0,0.55)', border: 'rgba(255,255,255,0.18)',
    radius: 14, padding: 16,
    nameColor: '#89e0ff', textColor: '#fff',
    fontStack: "'Inter', system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
    nameSize: 22, textSize: 18, lineHeight: 28
  },

  // Límites de zoom por plataforma
  CAM: { minZ: 0.25, maxZ: 3.2, defaultZMobile: 1.2, defaultZDesktop: 0.8 },

  // Preferencias de performance
  PERFORMANCE: {
    spatialGridSize: 200,
    idleFPS: 30,
    useOffscreenCanvas: true,
    prefetchNextWaypoint: true,
    autoCleanOldMaps: true,
    preferWebP: true,
    logPerformanceStats: true,
    logMemoryStats: true
  },

  // Transición de aparición/desaparición de iconos
  ICON_TRANSITION: {
    enabled: true,
    easingIn: 'ease-out',
    easingOut: 'ease-in',
    durationIn: 400,
    durationOut: 300,
    delayBetweenIcons: 50,
    scaleFrom: 0.3,
    opacityFrom: 0
  }
};
