// ========= CONFIG FASES =========
export const PHASES = [
  { id: 'fase1', label: 'Fase 1', color: '#1BC6EB', maps: ['mapa_f1'] },
  { id: 'fase2', label: 'Fase 2', color: '#FF6B6B', maps: ['mapa_f2'] },
  { id: 'fase3', label: 'Fase 3', color: '#4ECDC4', maps: ['mapa_f3'] },
];

// ========= MAPAS POR FASE =========
export const MAPS_CONFIG = {
  mapa_f1: {
    id: 'mapa_f1',
    name: 'Recorrido 1',
    phase: 'fase1',
    mapImage: {
      mobile: {
        src: '/assets/mapa-mobile.webp',
        logicalW: 2338,
        logicalH: 2779
      },
      desktop: {
        src: '/assets/mapa-dektop.webp',
        logicalW: 2858,
        logicalH: 1761
      },
      useNaturalSize: false
    },
    waypoints: [
      { 
        mobile: { xp: 0.13, yp: 0.19, z: 0.30 },
        desktop: { xp: 1.299, yp: 1.26, z: 1.88 },
        label: 'Inicio del Viaje', 
        lines: [
          'Aquí comienza la historia. Un punto de partida crucial que marca el inicio de esta aventura.',
          'Los detalles de este momento son fundamentales para entender todo lo que viene después.'
        ] 
      },
      { 
        mobile: { xp: 0.50, yp: 0.25, z: 0.10 },
        desktop: { xp: 0.750, yp: 0.25, z: 0.91 },
        label: 'Punto Central', 
        lines: [
          'En el corazón del territorio encontramos este lugar estratégico.',
          'Desde aquí se pueden observar todos los acontecimientos importantes.'
        ] 
      },
      { 
        mobile: { xp: 0.82, yp: 0.25, z: 0.010 },
        desktop: { xp: 0.26, yp: 0.75, z: 0.91 },
        label: 'Momento Culminante', 
        lines: [
          'Este es el punto donde todo cambia. Un momento decisivo en la narrativa.',
          'Los eventos que ocurren aquí tienen consecuencias duraderas.'
        ] 
      },
      { 
        mobile: { xp: 0.82, yp: 0.800, z: -0.020 },
        desktop: { xp: 0.750, yp: 0.75, z: 0.91 },
        label: 'Momento Culminante', 
        lines: [
          'Este es el punto donde todo cambia. Un momento decisivo en la narrativa.',
          'Los eventos que ocurren aquí tienen consecuencias duraderas.'
        ] 
      },
      { 
        mobile: { xp: 0.82, yp: 0.25, z: 0.010 },
        desktop: { xp: 0.26, yp: 1.20, z: 0.91 },
        label: 'Momento Culminanteeeee', 
        lines: [
          'Este es el punto donde eeeeeeeeeeeetodo cambia. Un momento decisivo en la narrativa.',
          'Los eventos que ocurren aquí tienen consecuencias duraderas.'
        ] 
      },
      { 
        mobile: { xp: 0.82, yp: 0.25, z: 0.010 },
        desktop: { xp: 0.725, yp: 1.25, z: 0.91 },
        label: 'mmmmmMomento Culminanteeeee', 
        lines: [
          'Este esu748484484884 el punto donde eeeeeeeeeeeetodo cambia. Un momento decisivo en la narrativa.',
          'Los eventos que ocurren aquí tienen consecuencias duraderas.'
        ] 
      }
    ],
    icons: {
      0: [
        { 
          type: 'hotspot',
          mobile: { offsetX: 33, offsetY: 21, width: 290, height: 176, rotation: 0 },
          desktop: { offsetX: -465, offsetY: -61, width: 388, height: 230, rotation: -10 },
          
          // ========= NUEVA ESTRUCTURA DETALLADA =========
          title: 'Llegada al Aeropuerto',
          
          // Imagen principal del evento
          image: '/assets/mapa-1.webp',
          
          // Fecha y hora del evento
          datetime: {
            date: '15/06/2025',
            time: '12:07',
            timeColor: '#FF4444' // Color rojo para la hora
          },
          
          // Ubicación geográfica
          location: 'Aeropuerto Juan Santamaría (SJO), Alajuela.',
          
          // Descripción detallada del evento
          description: 'Roberto Danilo Samcam Ruiz regresa a Costa Rica desde México. No se observan personas o situaciones sospechosas en su permanencia en San José. Sale en taxi formal (Taxi Tap) hacia su vivienda, conducido por José Roberto Naranjo González.',
          
          // Lista de personas implicadas
          involved: [
            {
              id: 'person1',
              name: 'Persona #1',
              avatar: './assets/persona_1-1.png',
              role: 'Pasajero'
            },
            {
              id: 'person2',
              name: 'Persona #2',
              avatar: './assets/persona_1-2.png',
              role: 'Conductor',
              highlighted: true // Esta persona está resaltada/seleccionada
            },
            {
              id: 'person3',
              name: 'Persona #3',
              avatar: './assets/persona_1-3.png',
              role: 'Testigo'
            }
          ],
          
          // Eventos relacionados (Echos) - se muestran cuando se selecciona una persona
          echos: {
            person2: [ // Echos de la Persona #2
              {
                datetime: {
                  date: '15/06/2025',
                  time: '12:07'
                },
                description: 'Roberto Danilo Samcam Ruiz regresa a Costa Rica desde México. No se observan personas o situaciones sospechosas.'
              },
              {
                datetime: {
                  date: '15/06/2025',
                  time: '14:30'
                },
                description: 'Segunda interacción documentada con el conductor en zona residencial.'
              }
            ],
            person1: [
              {
                datetime: {
                  date: '15/06/2025',
                  time: '11:45'
                },
                description: 'Arribo del vuelo internacional desde Ciudad de México.'
              }
            ],
            person3: [
              {
                datetime: {
                  date: '15/06/2025',
                  time: '12:10'
                },
                description: 'Observación del proceso de abordaje del taxi desde zona de espera.'
              }
            ]
          }
        },
        { 
          type: 'hotspot',
          mobile: { offsetX: 54, offsetY: 342, width: 221, height: 183, rotation: 0, radius: 0 },
          desktop: { offsetX: -115, offsetY: -101, width: 150, height: 156, rotation: 25 },
          
          // ========= SEGUNDA ESTRUCTURA DETALLADA =========
          title: 'Encuentro en Zona Residencial',
          
          image: '/assets/mapa-1.webp',
          
          datetime: {
            date: '16/06/2025',
            time: '18:45',
            timeColor: '#FF4444'
          },
          
          location: 'Barrio Escalante, San José.',
          
          description: 'Se documenta un segundo encuentro en zona residencial. Los participantes mantienen conversación de aproximadamente 15 minutos en establecimiento comercial. No se detectan comportamientos irregulares durante la observación.',
          
          involved: [
            {
              id: 'person4',
              name: 'Persona #4',
              avatar: './assets/persona_1-4.png',
              role: 'Contacto principal'
            },
            {
              id: 'person5',
              name: 'Persona #5',
              avatar: './assets/persona_1-1.png',
              role: 'Acompañante',
              highlighted: true
            },
            {
              id: 'person6',
              name: 'Persona #6',
              avatar: './assets/persona_1-2.png',
              role: 'Tercero presente'
            },
            {
              id: 'person7',
              name: 'Persona #7',
              avatar: './assets/persona_1-3.png',
              role: 'Observador'
            }
          ],
          
          echos: {
            person4: [
              {
                datetime: {
                  date: '16/06/2025',
                  time: '18:30'
                },
                description: 'Llegada al establecimiento comercial. Se observa actitud relajada y comportamiento normal.'
              },
              {
                datetime: {
                  date: '16/06/2025',
                  time: '19:00'
                },
                description: 'Salida del establecimiento. Se dirige hacia vehículo estacionado en zona lateral.'
              }
            ],
            person5: [
              {
                datetime: {
                  date: '16/06/2025',
                  time: '18:45'
                },
                description: 'Ingreso al establecimiento aproximadamente 5 minutos después del contacto principal.'
              },
              {
                datetime: {
                  date: '16/06/2025',
                  time: '19:05'
                },
                description: 'Permanece en el lugar después de la salida del contacto principal.'
              }
            ],
            person6: [
              {
                datetime: {
                  date: '16/06/2025',
                  time: '18:50'
                },
                description: 'Participa brevemente en la conversación. Duración aproximada: 3 minutos.'
              }
            ],
            person7: [
              {
                datetime: {
                  date: '16/06/2025',
                  time: '18:40'
                },
                description: 'Se mantiene en las inmediaciones durante todo el evento documentado.'
              }
            ]
          }
        },
        { 
          type: 'hotspot',
          mobile: { offsetX: -81, offsetY: -176, width: 85, height: 85, rotation: 0, radius: 30 },
          desktop: { offsetX: 233, offsetY: -61, width: 288, height: 185, rotation: 25, radius: 10  },
          title: 'Documento',
          body: 'Un documento importante encontrado en esta ubicación.'
        },
        { 
          type: 'hotspot',
          mobile: { offsetX: -130, offsetY: 540, width: 89, height: 89, rotation: 0, radius: 20},
          desktop: { offsetX: -1, offsetY: 142, width: 260, height: 160, rotation: 0, radius: 10},
          title: 'Contexto Geográfico',
          body: 'Ubicación específica y detalles del entorno. Características del lugar que influyen en los acontecimientos.'
        }
      ],
      1: [
        { 
          type: 'hotspot',
          mobile: { offsetX: -60, offsetY: -80, width: 136, height: 136, rotation: 0 },
          desktop: { offsetX: -90, offsetY: -90, width: 136, height: 136, rotation: 0 },
          title: 'Evolución del Personaje',
          body: 'Cómo ha cambiado el protagonista desde el inicio. Nuevas perspectivas y aprendizajes adquiridos.'
        },
        { 
          type: 'hotspot',
          mobile: { offsetX: 60, offsetY: -80, width: 136, height: 136, rotation: 0 },
          desktop: { offsetX: 90, offsetY: -90, width: 136, height: 136, rotation: 0 },
          title: 'Nuevos Encuentros',
          body: 'Personas que aparecen en este punto central. Su papel en el desarrollo de los eventos.'
        },
        { 
          type: 'hotspot',
          mobile: { offsetX: -60, offsetY: 80, width: 136, height: 136, rotation: 0 },
          desktop: { offsetX: -90, offsetY: 90, width: 136, height: 136, rotation: 0 },
          title: 'Elementos Descubiertos',
          body: 'Nuevos objetos y recursos encontrados. Su utilidad y significado en esta etapa del viaje.'
        },
        { 
          type: 'hotspot',
          img: './assets/icon-info.png',
          mobile: { offsetX: 60, offsetY: 80, width: 136, height: 136, rotation: 0 },
          desktop: { offsetX: 90, offsetY: 90, width: 136, height: 136, rotation: 0 },
          title: 'Zona Estratégica',
          body: 'Importancia táctica de esta ubicación. Ventajas y desafíos que presenta el terreno.'
        }
      ],
      2: [
        { 
          type: 'hotspot',
          img: './assets/icon-info.png',
          mobile: { offsetX: -60, offsetY: -80, width: 136, height: 136, rotation: 0 },
          desktop: { offsetX: -90, offsetY: -90, width: 136, height: 136, rotation: 0 },
          title: 'Transformación Final',
          body: 'El estado final del personaje. Cómo los acontecimientos han definido su destino.'
        },
        { 
          type: 'hotspot',
          img: './assets/icon-info.png',
          mobile: { offsetX: 60, offsetY: -80, width: 136, height: 136, rotation: 0 },
          desktop: { offsetX: 90, offsetY: -90, width: 136, height: 136, rotation: 0 },
          title: 'Testigos del Desenlace',
          body: 'Quiénes están presentes en este momento crucial. Su reacción ante los eventos finales.'
        },
        { 
          type: 'hotspot',
          img: './assets/icon-info.png',
          mobile: { offsetX: -60, offsetY: 80, width: 136, height: 136, rotation: 0 },
          desktop: { offsetX: -90, offsetY: 90, width: 136, height: 136, rotation: 0 },
          title: 'Legado Material',
          body: 'Objetos que permanecen como testimonio. Evidencia física de todo lo ocurrido.'
        },
        { 
          type: 'hotspot',
          img: './assets/icon-info.png',
          mobile: { offsetX: 60, offsetY: 80, width: 136, height: 136, rotation: 0 },
          desktop: { offsetX: 90, offsetY: 90, width: 136, height: 136, rotation: 0 },
          title: 'Lugar del Destino',
          body: 'El significado final de esta ubicación. Por qué todo termina precisamente aquí.'
        }
      ],
      3: [
        { 
          type: 'hotspot',
          img: '/assets/mapa-1.webp',
          mobile: { 
            offsetX: -60, 
            offsetY: -80, 
            width: 720,
            height: 280,
            rotation: 0 
          },
          desktop: { 
            offsetX: -90, 
            offsetY: -90, 
            width: 950,
            height: 900,
            rotation: 0 
          },
          title: 'Mapa del Territorio',
          body: 'Vista detallada de la zona completa. Este mapa muestra todos los lugares visitados.'
        },
        { 
          type: 'hotspot',
          mobile: { offsetX: 60, offsetY: -80, width: 130, height: 130, rotation: 0 },
          desktop: { offsetX: 90, offsetY: -90, width: 136, height: 136, rotation: 0 },
          title: 'Testigos del Desenlace',
          body: 'Quiénes están presentes en este momento crucial. Su reacción ante los eventos finales.'
        },
        { 
          type: 'hotspot',
          mobile: { offsetX: -60, offsetY: 80, width: 100, height: 180, radius: 10 },
          desktop: { offsetX: -90, offsetY: 90, width: 150, height: 120, radius: 10 },
          title: 'Legado Material',
          body: 'Objetos que permanecen como testimonio. Evidencia física de todo lo ocurrido.'
        },
        { 
          type: 'hotspot',
          mobile: { offsetX: 60, offsetY: 80, width: 136, height: 136, rotation: 0 },
          desktop: { offsetX: 90, offsetY: 90, width: 130, height: 90, rotation: 0 },
          title: 'Lugar del Destino',
          body: 'El significado final de esta ubicación. Por qué todo termina precisamente aquí.'
        }
      ],
      4: [
        { 
          type: 'icon',
          img: './assets/icon-info.png',
          mobile: { offsetX: -60, offsetY: -80, width: 36, height: 36, rotation: 0 },
          desktop: { offsetX: -90, offsetY: -90, width: 36, height: 36, rotation: 0 },
          title: 'Reflexión Final',
          body: 'El momento de entender todo lo vivido. Un espacio para procesar.'
        },
        { 
          type: 'icon',
          img: './assets/icon-info.png',
          mobile: { offsetX: 60, offsetY: -80, width: 36, height: 36, rotation: 0 },
          desktop: { offsetX: 90, offsetY: -90, width: 36, height: 36, rotation: 0 },
          title: 'Testigos del Final',
          body: 'Quiénes presencian el momento culminante. Su rol en la conclusión.'
        },
        { 
          type: 'icon',
          img: './assets/icon-info.png',
          mobile: { offsetX: -60, offsetY: 80, width: 36, height: 36, rotation: 0 },
          desktop: { offsetX: -90, offsetY: 90, width: 36, height: 36, rotation: 0 },
          title: 'Símbolos del Cierre',
          body: 'Objetos que representan la conclusión. Su significado simbólico final.'
        },
        { 
          type: 'icon',
          img: './assets/icon-info.png',
          mobile: { offsetX: 60, offsetY: 80, width: 36, height: 36, rotation: 0 },
          desktop: { offsetX: 90, offsetY: 90, width: 36, height: 36, rotation: 0 },
          title: 'Centro del Desenlace',
          body: 'El punto exacto donde todo converge y se resuelve.'
        }
      ],
      5: [
        { 
          type: 'icon',
          img: './assets/icon-info.png',
          mobile: { offsetX: -60, offsetY: -80, width: 36, height: 36, rotation: 0 },
          desktop: { offsetX: -90, offsetY: -90, width: 36, height: 36, rotation: 0 },
          title: 'Después de Todo',
          body: 'Cómo termina el protagonista después de esta experiencia. Su estado final.'
        },
        { 
          type: 'icon',
          img: './assets/icon-info.png',
          mobile: { offsetX: 60, offsetY: -80, width: 36, height: 36, rotation: 0 },
          desktop: { offsetX: 90, offsetY: -90, width: 36, height: 36, rotation: 0 },
          title: 'Vidas Transformadas',
          body: 'Cómo han cambiado todas las personas involucradas. El impacto duradero.'
        },
        { 
          type: 'icon',
          img: './assets/icon-info.png',
          mobile: { offsetX: -60, offsetY: 80, width: 36, height: 36, rotation: 0 },
          desktop: { offsetX: -90, offsetY: 90, width: 36, height: 36, rotation: 0 },
          title: 'Memoria Tangible',
          body: 'Lo que permanece físicamente como recordatorio de toda la historia.'
        },
        { 
          type: 'icon',
          img: '/assets/icon-info.png',
          mobile: { offsetX: 60, offsetY: 80, width: 36, height: 36, rotation: 0 },
          desktop: { offsetX: 90, offsetY: 90, width: 36, height: 36, rotation: 0 },
          title: 'Lugar de Reflexión',
          body: 'El último lugar donde la historia se contempla. Un espacio para entender todo lo vivido.'
        }
      ]
    }
  },
  mapa_f2: {
    id: 'mapa_f2',
    name: 'Recorrido 2',
    phase: 'fase2',
    mapImage: {
      mobile: {
        src: '/assets/mapa-mobile-2.webp',
        logicalW: 2338,
        logicalH: 2779
      },
      desktop: {
        src: '/assets/mapa-dektop-2.webp',
        logicalW: 2858,
        logicalH: 1761
      },
      useNaturalSize: false
    },
    waypoints: [
      { 
        mobile: { xp: 0.13, yp: 0.19, z: 0.30 },
        desktop: { xp: 0.299, yp: 0.26, z: 0.88 },
        label: 'Inicio del Viaje', 
        lines: [
          'Aquí comienza la historia. Un punto de partida crucial que marca el inicio de esta aventura.',
          'Los detalles de este momento son fundamentales para entender todo lo que viene después.'
        ] 
      },
      { 
        mobile: { xp: 0.50, yp: 0.25, z: 0.10 },
        desktop: { xp: 0.750, yp: 0.25, z: 0.91 },
        label: 'Punto Central', 
        lines: [
          'En el corazón del territorio encontramos este lugar estratégico.',
          'Desde aquí se pueden observar todos los acontecimientos importantes.'
        ] 
      },
      { 
        mobile: { xp: 0.82, yp: 0.25, z: 0.010 },
        desktop: { xp: 0.26, yp: 0.75, z: 0.91 },
        label: 'Momento Culminante', 
        lines: [
          'Este es el punto donde todo cambia. Un momento decisivo en la narrativa.',
          'Los eventos que ocurren aquí tienen consecuencias duraderas.'
        ] 
      },
      { 
        mobile: { xp: 0.82, yp: 0.800, z: -0.020 },
        desktop: { xp: 0.750, yp: 0.75, z: 0.91 },
        label: 'Momento Culminante', 
        lines: [
          'Este es el punto donde todo cambia. Un momento decisivo en la narrativa.',
          'Los eventos que ocurren aquí tienen consecuencias duraderas.'
        ] 
      },
      { 
        mobile: { xp: 0.82, yp: 0.25, z: 0.010 },
        desktop: { xp: 0.26, yp: 1.20, z: 0.91 },
        label: 'Momento Culminanteeeee', 
        lines: [
          'Este es el punto donde eeeeeeeeeeeetodo cambia. Un momento decisivo en la narrativa.',
          'Los eventos que ocurren aquí tienen consecuencias duraderas.'
        ] 
      },
      { 
        mobile: { xp: 0.82, yp: 0.25, z: 0.010 },
        desktop: { xp: 0.725, yp: 1.25, z: 0.91 },
        label: 'mmmmmMomento Culminanteeeee', 
        lines: [
          'Este esu748484484884 el punto donde eeeeeeeeeeeetodo cambia. Un momento decisivo en la narrativa.',
          'Los eventos que ocurren aquí tienen consecuencias duraderas.'
        ] 
      }
    ],
    icons: {
      0: [
        { 
          type: 'hotspot',
          mobile: { offsetX: 33, offsetY: 21, width: 290, height: 176, rotation: 0 },
          desktop: { offsetX: -482, offsetY: -55, width: 388, height: 230, rotation: -10 },
          
          // ========= NUEVA ESTRUCTURA DETALLADA =========
          title: 'Llegada al Aeropuerto',
          
          // Imagen principal del evento
          image: '/assets/mapa-1.webp',
          
          // Fecha y hora del evento
          datetime: {
            date: '15/06/2025',
            time: '12:07',
            timeColor: '#FF4444' // Color rojo para la hora
          },
          
          // Ubicación geográfica
          location: 'Aeropuerto Juan Santamaría (SJO), Alajuela.',
          
          // Descripción detallada del evento
          description: 'Roberto Danilo Samcam Ruiz regresa a Costa Rica desde México. No se observan personas o situaciones sospechosas en su permanencia en San José. Sale en taxi formal (Taxi Tap) hacia su vivienda, conducido por José Roberto Naranjo González.',
          
          // Lista de personas implicadas
          involved: [
            {
              id: 'person1',
              name: 'Persona #1',
              avatar: './assets/persona_1-1.png',
              role: 'Pasajero'
            },
            {
              id: 'person2',
              name: 'Persona #2',
              avatar: './assets/persona_1-2.png',
              role: 'Conductor',
              highlighted: true // Esta persona está resaltada/seleccionada
            },
            {
              id: 'person3',
              name: 'Persona #3',
              avatar: './assets/persona_1-3.png',
              role: 'Testigo'
            }
          ],
          
          // Eventos relacionados (Echos) - se muestran cuando se selecciona una persona
          echos: {
            person2: [ // Echos de la Persona #2
              {
                datetime: {
                  date: '15/06/2025',
                  time: '12:07'
                },
                description: 'Roberto Danilo Samcam Ruiz regresa a Costa Rica desde México. No se observan personas o situaciones sospechosas.'
              },
              {
                datetime: {
                  date: '15/06/2025',
                  time: '14:30'
                },
                description: 'Segunda interacción documentada con el conductor en zona residencial.'
              }
            ],
            person1: [
              {
                datetime: {
                  date: '15/06/2025',
                  time: '11:45'
                },
                description: 'Arribo del vuelo internacional desde Ciudad de México.'
              }
            ],
            person3: [
              {
                datetime: {
                  date: '15/06/2025',
                  time: '12:10'
                },
                description: 'Observación del proceso de abordaje del taxi desde zona de espera.'
              }
            ]
          }
        },
        { 
          type: 'hotspot',
          mobile: { offsetX: 54, offsetY: 342, width: 221, height: 183, rotation: -8.2, radius: 0 },
          desktop: { offsetX: -115, offsetY: -101, width: 150, height: 156, rotation: 25 },
          
          // ========= SEGUNDA ESTRUCTURA DETALLADA =========
          title: 'Encuentro en Zona Residencial',
          
          image: '/assets/mapa-1.webp',
          
          datetime: {
            date: '16/06/2025',
            time: '18:45',
            timeColor: '#FF4444'
          },
          
          location: 'Barrio Escalante, San José.',
          
          description: 'Se documenta un segundo encuentro en zona residencial. Los participantes mantienen conversación de aproximadamente 15 minutos en establecimiento comercial. No se detectan comportamientos irregulares durante la observación.',
          
          involved: [
            {
              id: 'person4',
              name: 'Persona #4',
              avatar: './assets/persona_1-4.png',
              role: 'Contacto principal'
            },
            {
              id: 'person5',
              name: 'Persona #5',
              avatar: './assets/persona_1-1.png',
              role: 'Acompañante',
              highlighted: true
            },
            {
              id: 'person6',
              name: 'Persona #6',
              avatar: './assets/persona_1-2.png',
              role: 'Tercero presente'
            },
            {
              id: 'person7',
              name: 'Persona #7',
              avatar: './assets/persona_1-3.png',
              role: 'Observador'
            }
          ],
          
          echos: {
            person4: [
              {
                datetime: {
                  date: '16/06/2025',
                  time: '18:30'
                },
                description: 'Llegada al establecimiento comercial. Se observa actitud relajada y comportamiento normal.'
              },
              {
                datetime: {
                  date: '16/06/2025',
                  time: '19:00'
                },
                description: 'Salida del establecimiento. Se dirige hacia vehículo estacionado en zona lateral.'
              }
            ],
            person5: [
              {
                datetime: {
                  date: '16/06/2025',
                  time: '18:45'
                },
                description: 'Ingreso al establecimiento aproximadamente 5 minutos después del contacto principal.'
              },
              {
                datetime: {
                  date: '16/06/2025',
                  time: '19:05'
                },
                description: 'Permanece en el lugar después de la salida del contacto principal.'
              }
            ],
            person6: [
              {
                datetime: {
                  date: '16/06/2025',
                  time: '18:50'
                },
                description: 'Participa brevemente en la conversación. Duración aproximada: 3 minutos.'
              }
            ],
            person7: [
              {
                datetime: {
                  date: '16/06/2025',
                  time: '18:40'
                },
                description: 'Se mantiene en las inmediaciones durante todo el evento documentado.'
              }
            ]
          }
        },
        { 
          type: 'hotspot',
          mobile: { offsetX: 281, offsetY: -176, width: 70, height: 70, rotation: 15, radius: 37 },
          desktop: { offsetX: -1, offsetY: -96, width: 160, height: 160, radius: 10, rotation: -10 },
          title: 'Documento',
          body: 'Un documento importante encontrado en esta ubicación.'
        },
        { 
          type: 'hotspot',
          mobile: { offsetX: 300, offsetY: 540, width: 83, height: 83, radius: 30, rotation: 0 },
          desktop: { offsetX: -1, offsetY: 142, width: 260, height: 160, radius: 10, rotation: 0 },
          title: 'Contexto Geográfico',
          body: 'Ubicación específica y detalles del entorno. Características del lugar que influyen en los acontecimientos.'
        }
      ],
      1: [
        { 
          type: 'hotspot',
          mobile: { offsetX: -60, offsetY: -80, width: 136, height: 136, rotation: 0 },
          desktop: { offsetX: -90, offsetY: -90, width: 136, height: 136, rotation: 0 },
          title: 'Evolución del Personaje',
          body: 'Cómo ha cambiado el protagonista desde el inicio. Nuevas perspectivas y aprendizajes adquiridos.'
        },
        { 
          type: 'hotspot',
          mobile: { offsetX: 60, offsetY: -80, width: 136, height: 136, rotation: 0 },
          desktop: { offsetX: 90, offsetY: -90, width: 136, height: 136, rotation: 0 },
          title: 'Nuevos Encuentros',
          body: 'Personas que aparecen en este punto central. Su papel en el desarrollo de los eventos.'
        },
        { 
          type: 'hotspot',
          mobile: { offsetX: -60, offsetY: 80, width: 136, height: 136, rotation: 0 },
          desktop: { offsetX: -90, offsetY: 90, width: 136, height: 136, rotation: 0 },
          title: 'Elementos Descubiertos',
          body: 'Nuevos objetos y recursos encontrados. Su utilidad y significado en esta etapa del viaje.'
        },
        { 
          type: 'hotspot',
          img: './assets/icon-info.png',
          mobile: { offsetX: 60, offsetY: 80, width: 136, height: 136, rotation: 0 },
          desktop: { offsetX: 90, offsetY: 90, width: 136, height: 136, rotation: 0 },
          title: 'Zona Estratégica',
          body: 'Importancia táctica de esta ubicación. Ventajas y desafíos que presenta el terreno.'
        }
      ],
      2: [
        { 
          type: 'hotspot',
          img: './assets/icon-info.png',
          mobile: { offsetX: -60, offsetY: -80, width: 136, height: 136, rotation: 0 },
          desktop: { offsetX: -90, offsetY: -90, width: 136, height: 136, rotation: 0 },
          title: 'Transformación Final',
          body: 'El estado final del personaje. Cómo los acontecimientos han definido su destino.'
        },
        { 
          type: 'hotspot',
          img: './assets/icon-info.png',
          mobile: { offsetX: 60, offsetY: -80, width: 136, height: 136, rotation: 0 },
          desktop: { offsetX: 90, offsetY: -90, width: 136, height: 136, rotation: 0 },
          title: 'Testigos del Desenlace',
          body: 'Quiénes están presentes en este momento crucial. Su reacción ante los eventos finales.'
        },
        { 
          type: 'hotspot',
          img: './assets/icon-info.png',
          mobile: { offsetX: -60, offsetY: 80, width: 136, height: 136, rotation: 0 },
          desktop: { offsetX: -90, offsetY: 90, width: 136, height: 136, rotation: 0 },
          title: 'Legado Material',
          body: 'Objetos que permanecen como testimonio. Evidencia física de todo lo ocurrido.'
        },
        { 
          type: 'hotspot',
          img: './assets/icon-info.png',
          mobile: { offsetX: 60, offsetY: 80, width: 136, height: 136, rotation: 0 },
          desktop: { offsetX: 90, offsetY: 90, width: 136, height: 136, rotation: 0 },
          title: 'Lugar del Destino',
          body: 'El significado final de esta ubicación. Por qué todo termina precisamente aquí.'
        }
      ],
      3: [
        { 
          type: 'hotspot',
          img: '/assets/mapa-1.webp',
          mobile: { 
            offsetX: -60, 
            offsetY: -80, 
            width: 720,
            height: 280,
            rotation: 10 
          },
          desktop: { 
            offsetX: -90, 
            offsetY: -90, 
            width: 950,
            height: 900,
            rotation: -15 
          },
          title: 'Mapa del Territorio',
          body: 'Vista detallada de la zona completa. Este mapa muestra todos los lugares visitados.'
        },
        { 
          type: 'hotspot',
          mobile: { offsetX: 60, offsetY: -80, width: 130, height: 130, rotation: 0 },
          desktop: { offsetX: 90, offsetY: -90, width: 136, height: 136, rotation: 0 },
          title: 'Testigos del Desenlace',
          body: 'Quiénes están presentes en este momento crucial. Su reacción ante los eventos finales.'
        },
        { 
          type: 'hotspot',
          mobile: { offsetX: -60, offsetY: 80, width: 100, height: 180, radius: 10 },
          desktop: { offsetX: -90, offsetY: 90, width: 150, height: 120, radius: 10 },
          title: 'Legado Material',
          body: 'Objetos que permanecen como testimonio. Evidencia física de todo lo ocurrido.'
        },
        { 
          type: 'hotspot',
          mobile: { offsetX: 60, offsetY: 80, width: 136, height: 136, rotation: 0 },
          desktop: { offsetX: 90, offsetY: 90, width: 130, height: 90, rotation: 0 },
          title: 'Lugar del Destino',
          body: 'El significado final de esta ubicación. Por qué todo termina precisamente aquí.'
        }
      ],
      4: [
        { 
          type: 'icon',
          img: './assets/icon-info.png',
          mobile: { offsetX: -60, offsetY: -80, width: 36, height: 36, rotation: 0 },
          desktop: { offsetX: -90, offsetY: -90, width: 36, height: 36, rotation: 0 },
          title: 'Reflexión Final',
          body: 'El momento de entender todo lo vivido. Un espacio para procesar.'
        },
        { 
          type: 'icon',
          img: './assets/icon-info.png',
          mobile: { offsetX: 60, offsetY: -80, width: 36, height: 36, rotation: 0 },
          desktop: { offsetX: 90, offsetY: -90, width: 36, height: 36, rotation: 0 },
          title: 'Testigos del Final',
          body: 'Quiénes presencian el momento culminante. Su rol en la conclusión.'
        },
        { 
          type: 'icon',
          img: './assets/icon-info.png',
          mobile: { offsetX: -60, offsetY: 80, width: 36, height: 36, rotation: 0 },
          desktop: { offsetX: -90, offsetY: 90, width: 36, height: 36, rotation: 0 },
          title: 'Símbolos del Cierre',
          body: 'Objetos que representan la conclusión. Su significado simbólico final.'
        },
        { 
          type: 'icon',
          img: './assets/icon-info.png',
          mobile: { offsetX: 60, offsetY: 80, width: 36, height: 36, rotation: 0 },
          desktop: { offsetX: 90, offsetY: 90, width: 36, height: 36, rotation: 0 },
          title: 'Centro del Desenlace',
          body: 'El punto exacto donde todo converge y se resuelve.'
        }
      ],
      5: [
        { 
          type: 'icon',
          img: './assets/icon-info.png',
          mobile: { offsetX: -60, offsetY: -80, width: 36, height: 36, rotation: 0 },
          desktop: { offsetX: -90, offsetY: -90, width: 36, height: 36, rotation: 0 },
          title: 'Después de Todo',
          body: 'Cómo termina el protagonista después de esta experiencia. Su estado final.'
        },
        { 
          type: 'icon',
          img: './assets/icon-info.png',
          mobile: { offsetX: 60, offsetY: -80, width: 36, height: 36, rotation: 0 },
          desktop: { offsetX: 90, offsetY: -90, width: 36, height: 36, rotation: 0 },
          title: 'Vidas Transformadas',
          body: 'Cómo han cambiado todas las personas involucradas. El impacto duradero.'
        },
        { 
          type: 'icon',
          img: './assets/icon-info.png',
          mobile: { offsetX: -60, offsetY: 80, width: 36, height: 36, rotation: 0 },
          desktop: { offsetX: -90, offsetY: 90, width: 36, height: 36, rotation: 0 },
          title: 'Memoria Tangible',
          body: 'Lo que permanece físicamente como recordatorio de toda la historia.'
        },
        { 
          type: 'icon',
          img: './assets/icon-info.png',
          mobile: { offsetX: 60, offsetY: 80, width: 36, height: 36, rotation: 0 },
          desktop: { offsetX: 90, offsetY: 90, width: 36, height: 36, rotation: 0 },
          title: 'Lugar de Reflexión',
          body: 'El último lugar donde la historia se contempla. Un espacio para entender todo lo vivido.'
        }
      ]
    }
  },
  mapa_f3: {
    id: 'mapa_f3',
    name: 'Recorrido 3',
    phase: 'fase3',
    mapImage: {
      mobile: {
        src: '/assets/mapa-mobile-3.webp',
        logicalW: 2338,
        logicalH: 2779
      },
      desktop: {
        src: '/assets/mapa-dektop-3.webp',
        logicalW: 2858,
        logicalH: 1761
      },
      useNaturalSize: false
    },
    waypoints: [
      { 
        mobile: { xp: 0.13, yp: 0.19, z: 0.30 },
        desktop: { xp: 0.299, yp: 0.26, z: 0.88 },
        label: 'Inicio del Viaje', 
        lines: [
          'Aquí comienza la historia. Un punto de partida crucial que marca el inicio de esta aventura.',
          'Los detalles de este momento son fundamentales para entender todo lo que viene después.'
        ] 
      },
      { 
        mobile: { xp: 0.50, yp: 0.25, z: 0.10 },
        desktop: { xp: 0.750, yp: 0.25, z: 0.91 },
        label: 'Punto Central', 
        lines: [
          'En el corazón del territorio encontramos este lugar estratégico.',
          'Desde aquí se pueden observar todos los acontecimientos importantes.'
        ] 
      },
      { 
        mobile: { xp: 0.82, yp: 0.25, z: 0.010 },
        desktop: { xp: 0.26, yp: 0.75, z: 0.91 },
        label: 'Momento Culminante', 
        lines: [
          'Este es el punto donde todo cambia. Un momento decisivo en la narrativa.',
          'Los eventos que ocurren aquí tienen consecuencias duraderas.'
        ] 
      },
      { 
        mobile: { xp: 0.82, yp: 0.800, z: -0.020 },
        desktop: { xp: 0.750, yp: 0.75, z: 0.91 },
        label: 'Momento Culminante', 
        lines: [
          'Este es el punto donde todo cambia. Un momento decisivo en la narrativa.',
          'Los eventos que ocurren aquí tienen consecuencias duraderas.'
        ] 
      },
      { 
        mobile: { xp: 0.82, yp: 0.25, z: 0.010 },
        desktop: { xp: 0.26, yp: 1.20, z: 0.91 },
        label: 'Momento Culminanteeeee', 
        lines: [
          'Este es el punto donde eeeeeeeeeeeetodo cambia. Un momento decisivo en la narrativa.',
          'Los eventos que ocurren aquí tienen consecuencias duraderas.'
        ] 
      },
      { 
        mobile: { xp: 0.82, yp: 0.25, z: 0.010 },
        desktop: { xp: 0.725, yp: 1.25, z: 0.91 },
        label: 'mmmmmMomento Culminanteeeee', 
        lines: [
          'Este esu748484484884 el punto donde eeeeeeeeeeeetodo cambia. Un momento decisivo en la narrativa.',
          'Los eventos que ocurren aquí tienen consecuencias duraderas.'
        ] 
      }
    ],
    icons: {
      0: [
        { 
          type: 'hotspot',
          mobile: { offsetX: 33, offsetY: 21, width: 290, height: 176, rotation: 6.5 },
          desktop: { offsetX: -482, offsetY: -55, width: 388, height: 230, rotation: -10 },
          
          // ========= NUEVA ESTRUCTURA DETALLADA =========
          title: 'Llegada al Aeropuerto',
          
          // Imagen principal del evento
          image: '/assets/mapa-1.webp',
          
          // Fecha y hora del evento
          datetime: {
            date: '15/06/2025',
            time: '12:07',
            timeColor: '#FF4444' // Color rojo para la hora
          },
          
          // Ubicación geográfica
          location: 'Aeropuerto Juan Santamaría (SJO), Alajuela.',
          
          // Descripción detallada del evento
          description: 'Roberto Danilo Samcam Ruiz regresa a Costa Rica desde México. No se observan personas o situaciones sospechosas en su permanencia en San José. Sale en taxi formal (Taxi Tap) hacia su vivienda, conducido por José Roberto Naranjo González.',
          
          // Lista de personas implicadas
          involved: [
            {
              id: 'person1',
              name: 'Persona #1',
              avatar: '/assets/persona_1-1.png',
              role: 'Pasajero'
            },
            {
              id: 'person2',
              name: 'Persona #2',
              avatar: './assets/persona_1-2.png',
              role: 'Conductor',
              highlighted: true // Esta persona está resaltada/seleccionada
            },
            {
              id: 'person3',
              name: 'Persona #3',
              avatar: './assets/persona_1-3.png',
              role: 'Testigo'
            }
          ],
          
          // Eventos relacionados (Echos) - se muestran cuando se selecciona una persona
          echos: {
            person2: [ // Echos de la Persona #2
              {
                datetime: {
                  date: '15/06/2025',
                  time: '12:07'
                },
                description: 'Roberto Danilo Samcam Ruiz regresa a Costa Rica desde México. No se observan personas o situaciones sospechosas.'
              },
              {
                datetime: {
                  date: '15/06/2025',
                  time: '14:30'
                },
                description: 'Segunda interacción documentada con el conductor en zona residencial.'
              }
            ],
            person1: [
              {
                datetime: {
                  date: '15/06/2025',
                  time: '11:45'
                },
                description: 'Arribo del vuelo internacional desde Ciudad de México.'
              }
            ],
            person3: [
              {
                datetime: {
                  date: '15/06/2025',
                  time: '12:10'
                },
                description: 'Observación del proceso de abordaje del taxi desde zona de espera.'
              }
            ]
          }
        },
        { 
          type: 'hotspot',
          mobile: { offsetX: 54, offsetY: 342, width: 221, height: 183, rotation: -8.2, radius: 0 },
          desktop: { offsetX: -115, offsetY: -101, width: 150, height: 156, rotation: 25 },
          
          // ========= SEGUNDA ESTRUCTURA DETALLADA =========
          title: 'Encuentro en Zona Residencial',
          
          image: '/assets/mapa-1.webp',
          
          datetime: {
            date: '16/06/2025',
            time: '18:45',
            timeColor: '#FF4444'
          },
          
          location: 'Barrio Escalante, San José.',
          
          description: 'Se documenta un segundo encuentro en zona residencial. Los participantes mantienen conversación de aproximadamente 15 minutos en establecimiento comercial. No se detectan comportamientos irregulares durante la observación.',
          
          involved: [
            {
              id: 'person4',
              name: 'Persona #4',
              avatar: './assets/persona_1-4.png',
              role: 'Contacto principal'
            },
            {
              id: 'person5',
              name: 'Persona #5',
              avatar: './assets/persona_1-1.png',
              role: 'Acompañante',
              highlighted: true
            },
            {
              id: 'person6',
              name: 'Persona #6',
              avatar: './assets/persona_1-2.png',
              role: 'Tercero presente'
            },
            {
              id: 'person7',
              name: 'Persona #7',
              avatar: './assets/persona_1-3.png',
              role: 'Observador'
            }
          ],
          
          echos: {
            person4: [
              {
                datetime: {
                  date: '16/06/2025',
                  time: '18:30'
                },
                description: 'Llegada al establecimiento comercial. Se observa actitud relajada y comportamiento normal.'
              },
              {
                datetime: {
                  date: '16/06/2025',
                  time: '19:00'
                },
                description: 'Salida del establecimiento. Se dirige hacia vehículo estacionado en zona lateral.'
              }
            ],
            person5: [
              {
                datetime: {
                  date: '16/06/2025',
                  time: '18:45'
                },
                description: 'Ingreso al establecimiento aproximadamente 5 minutos después del contacto principal.'
              },
              {
                datetime: {
                  date: '16/06/2025',
                  time: '19:05'
                },
                description: 'Permanece en el lugar después de la salida del contacto principal.'
              }
            ],
            person6: [
              {
                datetime: {
                  date: '16/06/2025',
                  time: '18:50'
                },
                description: 'Participa brevemente en la conversación. Duración aproximada: 3 minutos.'
              }
            ],
            person7: [
              {
                datetime: {
                  date: '16/06/2025',
                  time: '18:40'
                },
                description: 'Se mantiene en las inmediaciones durante todo el evento documentado.'
              }
            ]
          }
        },
        { 
          type: 'hotspot',
          mobile: { offsetX: 281, offsetY: -176, width: 70, height: 70, rotation: 15, radius: 37 },
          desktop: { offsetX: -1, offsetY: -96, width: 160, height: 160, radius: 10, rotation: -10 },
          title: 'Documento',
          body: 'Un documento importante encontrado en esta ubicación.'
        },
        { 
          type: 'hotspot',
          mobile: { offsetX: 300, offsetY: 540, width: 83, height: 83, radius: 30, rotation: 0 },
          desktop: { offsetX: -1, offsetY: 142, width: 260, height: 160, radius: 10, rotation: 0 },
          title: 'Contexto Geográfico',
          body: 'Ubicación específica y detalles del entorno. Características del lugar que influyen en los acontecimientos.'
        }
      ],
      1: [
        { 
          type: 'hotspot',
          mobile: { offsetX: -60, offsetY: -80, width: 136, height: 136, rotation: 0 },
          desktop: { offsetX: -90, offsetY: -90, width: 136, height: 136, rotation: 0 },
          title: 'Evolución del Personaje',
          body: 'Cómo ha cambiado el protagonista desde el inicio. Nuevas perspectivas y aprendizajes adquiridos.'
        },
        { 
          type: 'hotspot',
          mobile: { offsetX: 60, offsetY: -80, width: 136, height: 136, rotation: 0 },
          desktop: { offsetX: 90, offsetY: -90, width: 136, height: 136, rotation: 0 },
          title: 'Nuevos Encuentros',
          body: 'Personas que aparecen en este punto central. Su papel en el desarrollo de los eventos.'
        },
        { 
          type: 'hotspot',
          mobile: { offsetX: -60, offsetY: 80, width: 136, height: 136, rotation: 0 },
          desktop: { offsetX: -90, offsetY: 90, width: 136, height: 136, rotation: 0 },
          title: 'Elementos Descubiertos',
          body: 'Nuevos objetos y recursos encontrados. Su utilidad y significado en esta etapa del viaje.'
        },
        { 
          type: 'hotspot',
          img: './assets/icon-info.png',
          mobile: { offsetX: 60, offsetY: 80, width: 136, height: 136, rotation: 0 },
          desktop: { offsetX: 90, offsetY: 90, width: 136, height: 136, rotation: 0 },
          title: 'Zona Estratégica',
          body: 'Importancia táctica de esta ubicación. Ventajas y desafíos que presenta el terreno.'
        }
      ],
      2: [
        { 
          type: 'hotspot',
          img: './assets/icon-info.png',
          mobile: { offsetX: -60, offsetY: -80, width: 136, height: 136, rotation: 0 },
          desktop: { offsetX: -90, offsetY: -90, width: 136, height: 136, rotation: 0 },
          title: 'Transformación Final',
          body: 'El estado final del personaje. Cómo los acontecimientos han definido su destino.'
        },
        { 
          type: 'hotspot',
          img: './assets/icon-info.png',
          mobile: { offsetX: 60, offsetY: -80, width: 136, height: 136, rotation: 0 },
          desktop: { offsetX: 90, offsetY: -90, width: 136, height: 136, rotation: 0 },
          title: 'Testigos del Desenlace',
          body: 'Quiénes están presentes en este momento crucial. Su reacción ante los eventos finales.'
        },
        { 
          type: 'hotspot',
          img: './assets/icon-info.png',
          mobile: { offsetX: -60, offsetY: 80, width: 136, height: 136, rotation: 0 },
          desktop: { offsetX: -90, offsetY: 90, width: 136, height: 136, rotation: 0 },
          title: 'Legado Material',
          body: 'Objetos que permanecen como testimonio. Evidencia física de todo lo ocurrido.'
        },
        { 
          type: 'hotspot',
          img: './assets/icon-info.png',
          mobile: { offsetX: 60, offsetY: 80, width: 136, height: 136, rotation: 0 },
          desktop: { offsetX: 90, offsetY: 90, width: 136, height: 136, rotation: 0 },
          title: 'Lugar del Destino',
          body: 'El significado final de esta ubicación. Por qué todo termina precisamente aquí.'
        }
      ],
      3: [
        { 
          type: 'hotspot',
          img: '/assets/mapa-1.webp',
          mobile: { 
            offsetX: -60, 
            offsetY: -80, 
            width: 720,
            height: 280,
            rotation: 10 
          },
          desktop: { 
            offsetX: -90, 
            offsetY: -90, 
            width: 950,
            height: 900,
            rotation: -15 
          },
          title: 'Mapa del Territorio',
          body: 'Vista detallada de la zona completa. Este mapa muestra todos los lugares visitados.'
        },
        { 
          type: 'hotspot',
          mobile: { offsetX: 60, offsetY: -80, width: 130, height: 130, rotation: 0 },
          desktop: { offsetX: 90, offsetY: -90, width: 136, height: 136, rotation: 0 },
          title: 'Testigos del Desenlace',
          body: 'Quiénes están presentes en este momento crucial. Su reacción ante los eventos finales.'
        },
        { 
          type: 'hotspot',
          mobile: { offsetX: -60, offsetY: 80, width: 100, height: 180, radius: 10 },
          desktop: { offsetX: -90, offsetY: 90, width: 150, height: 120, radius: 10 },
          title: 'Legado Material',
          body: 'Objetos que permanecen como testimonio. Evidencia física de todo lo ocurrido.'
        },
        { 
          type: 'hotspot',
          mobile: { offsetX: 60, offsetY: 80, width: 136, height: 136, rotation: 0 },
          desktop: { offsetX: 90, offsetY: 90, width: 130, height: 90, rotation: 0 },
          title: 'Lugar del Destino',
          body: 'El significado final de esta ubicación. Por qué todo termina precisamente aquí.'
        }
      ],
      4: [
        { 
          type: 'icon',
          img: './assets/icon-info.png',
          mobile: { offsetX: -60, offsetY: -80, width: 36, height: 36, rotation: 0 },
          desktop: { offsetX: -90, offsetY: -90, width: 36, height: 36, rotation: 0 },
          title: 'Reflexión Final',
          body: 'El momento de entender todo lo vivido. Un espacio para procesar.'
        },
        { 
          type: 'icon',
          img: './assets/icon-info.png',
          mobile: { offsetX: 60, offsetY: -80, width: 36, height: 36, rotation: 0 },
          desktop: { offsetX: 90, offsetY: -90, width: 36, height: 36, rotation: 0 },
          title: 'Testigos del Final',
          body: 'Quiénes presencian el momento culminante. Su rol en la conclusión.'
        },
        { 
          type: 'icon',
          img: './assets/icon-info.png',
          mobile: { offsetX: -60, offsetY: 80, width: 36, height: 36, rotation: 0 },
          desktop: { offsetX: -90, offsetY: 90, width: 36, height: 36, rotation: 0 },
          title: 'Símbolos del Cierre',
          body: 'Objetos que representan la conclusión. Su significado simbólico final.'
        },
        { 
          type: 'icon',
          img: './assets/icon-info.png',
          mobile: { offsetX: 60, offsetY: 80, width: 36, height: 36, rotation: 0 },
          desktop: { offsetX: 90, offsetY: 90, width: 36, height: 36, rotation: 0 },
          title: 'Centro del Desenlace',
          body: 'El punto exacto donde todo converge y se resuelve.'
        }
      ],
      5: [
        { 
          type: 'icon',
          img: './assets/icon-info.png',
          mobile: { offsetX: -60, offsetY: -80, width: 36, height: 36, rotation: 0 },
          desktop: { offsetX: -90, offsetY: -90, width: 36, height: 36, rotation: 0 },
          title: 'Después de Todo',
          body: 'Cómo termina el protagonista después de esta experiencia. Su estado final.'
        },
        { 
          type: 'icon',
          img: './assets/icon-info.png',
          mobile: { offsetX: 60, offsetY: -80, width: 36, height: 36, rotation: 0 },
          desktop: { offsetX: 90, offsetY: -90, width: 36, height: 36, rotation: 0 },
          title: 'Vidas Transformadas',
          body: 'Cómo han cambiado todas las personas involucradas. El impacto duradero.'
        },
        { 
          type: 'icon',
          img: './assets/icon-info.png',
          mobile: { offsetX: -60, offsetY: 80, width: 36, height: 36, rotation: 0 },
          desktop: { offsetX: -90, offsetY: 90, width: 36, height: 36, rotation: 0 },
          title: 'Memoria Tangible',
          body: 'Lo que permanece físicamente como recordatorio de toda la historia.'
        },
        { 
          type: 'icon',
          img: './assets/icon-info.png',
          mobile: { offsetX: 60, offsetY: 80, width: 36, height: 36, rotation: 0 },
          desktop: { offsetX: 90, offsetY: 90, width: 36, height: 36, rotation: 0 },
          title: 'Lugar de Reflexión',
          body: 'El último lugar donde la historia se contempla. Un espacio para entender todo lo vivido.'
        }
      ]
    }
  }
};

// ========= CONFIG GLOBAL (OPTIMIZADO CON NUEVAS FUNCIONES) =========
const GLOBAL_CONFIG = {
  // Estilos para los waypoints
  WAYPOINT_STYLES: {
    active: {
      fill: 'rgba(255, 100, 100, 0.8)',
      stroke: 'rgba(255, 255, 255, 0.9)',
      radius: 8,
      glow: {
        color: 'rgba(255, 100, 100, 0.4)',
        size: 1.5
      }
    },
    inactive: {
      fill: 'rgba(100, 100, 255, 0.6)',
      stroke: 'rgba(255, 255, 255, 0.7)',
      radius: 6
    },
    line: {
      color: 'rgba(255, 255, 255, 0.3)',
      width: 2,
      dash: [5, 5] // Sólido por defecto, usar [5, 5] para línea punteada
    },
    // Animación de transición entre waypoints
    transition: {
      duration: 1000, // ms
      easing: 'easeInOutQuad'
    }
  },
  // Configuración de renderizado de waypoints
  WAYPOINT_RENDERING: {
    enableCulling: true,
    maxVisibleWaypoints: 50, // Máximo de waypoints a renderizar
    cullingMargin: 1.5 // Margen adicional para culling (en pantallas)
  },
  // Control de visibilidad SEPARADO
  SHOW_DIALOGS: false,   // Controla los cuadros de diálogo de texto
  SHOW_CONTROLS: true,  // Controla los botones de navegación (prev/next/progress)
  
  // ========= DEBUG Y VISUALIZACIÓN =========
    // DEBUG_HOTSPOTS: true, Activa marcos blancos de depuración (false en producción)
  
  // Estilos para iconos y hotspots
  ICON_STYLES: {
    showBackground: true,  // Fondo semi-transparente en debug (opcional)
    backgroundColor: 'rgba(0, 209, 255, .18)',  // Fondo azul claro
    borderColor: 'rgba(255,255,255,.55)',  // Color del marco blanco semi-transparente
    borderWidth: 3,  // Grosor del marco (aumentado a 3px para mejor visibilidad en mobile)
    debugFill: 'rgba(255,0,0,0.12)'  // Fondo rojo sutil para hotspots en debug
  },
  
  // Configuración de toque
  TOUCH: {
    mobileMin: 56,  // Tamaño mínimo en mobile para toque
    desktopMin: 40,  // Tamaño mínimo en desktop
    hitSlop: 4  // Margen invisible extra para clics
  },
  
  // ========= EFECTOS DE CÁMARA =========
  CAMERA_EFFECTS: {
    // Movimiento sutil constante (breathing)
    breathingEnabled: false,
    breathingAmount: 9.5,        // Píxeles de movimiento en Y
    breathingSpeed: 0.0009,      // Velocidad de oscilación (más bajo = más lento)
    breathingZAmount: 0.0009,    // Cambio sutil en zoom
    
    // Transición cinemática entre waypoints
    transitionEnabled: true,
    transitionDuration: 1200,    // Milisegundos
    transitionZoomOut: 0.25,     // Cuánto hacer zoom out (0.25 = -25% del zoom actual)
    transitionEasing: 'ease-in-out', // 'linear', 'ease-in', 'ease-out', 'ease-in-out'
  },
  
  // ========= 🆕 LÍMITES DE CANVAS OPTIMIZADOS =========
  CANVAS_LIMITS: {
    desktop: {
      maxWidth: 4096,
      maxHeight: 4096,
      maxPixels: 12_000_000,  // ~4000×3000
      maxMemoryMB: 150
    },
    mobile: {
      maxWidth: 2048,
      maxHeight: 4500,        // ✅ Soporta 4000px altura
      maxPixels: 8_000_000,   // ~2000×4000
      maxMemoryMB: 100
    },
    downscaleFactor: 0.8,
    warnThreshold: 0.85       // Alertar cuando use >85% del límite
  },
  
  // ========= 🆕 OPTIMIZACIÓN DE WAYPOINTS =========
  WAYPOINT_RENDERING: {
    enableCulling: true,
    cullingMargin: 300,
    maxVisibleWaypoints: 20,
    useSpatialIndex: true,
    spatialIndexThreshold: 15,  // Usar index si hay >15 waypoints
    cellSize: 500                // Tamaño de celda para spatial grid
  },
  
  // ========= 🆕 GESTIÓN DE MEMORIA =========
  MEMORY_MANAGEMENT: {
    maxActivePhaseCaches: 1,          // Solo 1 fase en memoria
    autoCleanInactivePhases: true,    // Limpiar automáticamente
    unloadAfterPhaseChange: true,     // Liberar memoria al cambiar
    forceClearCache: true,            // Forzar limpieza de cache
    logMemoryUsage: true              // Log de uso de memoria
  },
  
  // ========= 🆕 OPTIMIZACIONES MOBILE =========
  MOBILE_OPTIMIZATIONS: {
    maxDPR: 1.5,                      // Limitar DPR en mobile
    disableBreathingOnLowEnd: true,   // Desactivar breathing si FPS <45
    reduceTransitionQuality: true,    // Transiciones más simples
    targetFPS: 45,                    // FPS objetivo en mobile
    aggressiveCulling: true           // Culling más agresivo
  },

  RESPONSIVE_SIZING: {
  mobile:  { lockItemWidthToScreenPx: false },  // activa ancho fijo en mobile
  desktop: { lockItemWidthToScreenPx: false }  // desktop se mantiene igual
},

  
  // ========= MODO DEBUG MEJORADO =========
  DEBUG_HOTSPOTS: true,              // Visualizar áreas invisibles (hotspots)
  SHOW_POPUP_ON_CLICK: true,
  DEBUG_SHOW_GRID: true,             // Mostrar cuadrícula de referencia cada 10%
  DEBUG_SHOW_COORDS: true,           // Mostrar coordenadas en cada área
  DEBUG_SHOW_MINIMAP_MOBILE: true,   // Mostrar minimap en mobile
  DEBUG_SHOW_WAYPOINT_LABELS: true,  // Mostrar números en waypoints
  DEBUG_SHOW_MEMORY_STATS: true,     // 🆕 Mostrar uso de memoria
  DEBUG_SHOW_WAYPOINT_HUD: true,
  
  // Estilos de iconos
  ICON_STYLES: {
    showBackground: true,
    backgroundColor: 'rgba(0, 209, 255, .18)',
    borderColor: 'rgba(255,255,255,.55)',
    borderWidth: 1.5
  },
  
  // ===== CANVAS HOTSPOTS & EDITOR =====
  DRAW_HOTSPOTS_ON_CANVAS: true,     // Dibujar hotspots en canvas para referencia/editor
  SYNC_OVERLAYS_WITH_EDITOR: true,   // Sincronización automática de overlays con el editor
  
  // Estilos para los hotspots en canvas
  CANVAS_HOTSPOT_STYLES: {
    fill: 'rgba(0, 209, 255, 0.1)',    // Color de relleno con transparencia
    stroke: 'rgba(0, 209, 255, 0.5)',  // Color del borde
    lineWidth: 1,                      // Grosor del borde
    activeFill: 'rgba(0, 209, 255, 0.2)',   // Color al estar activo
    activeStroke: 'rgba(255, 255, 255, 0.8)' // Borde al estar activo
  },
  
  WAYPOINT_OFFSET: {
    mobile: 0,
    desktop: 0
  },

  BASE_W: 1280,
  BASE_H: 720,
  TYPE_SPEED: 18,
  EASE: 0.08,
  MARKER_R: 8,
  ICON_R: 18,
  ICON_SIZE: 36,
  DPR_MAX: 2,
  
  MOBILE_BREAKPOINT: 900,
  CANVAS_MIN_HEIGHT: 720,
  
  DIALOG_BOX: {
    x: 16, 
    y: 720 - 220, 
    w: 1280 - 32, 
    h: 180,
    bg: 'rgba(0,0,0,0.55)', 
    border: 'rgba(255,255,255,0.18)', 
    radius: 14, 
    padding: 16,
    nameColor: '#89e0ff', 
    textColor: '#fff',
    fontStack: "'Inter', system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
    nameSize: 22, 
    textSize: 18, 
    lineHeight: 28
  },
  
  CAM: {
    minZ: 0.25, 
    maxZ: 3.2,
    defaultZMobile: 1.2, 
    defaultZDesktop: 0.8
  },

  PERFORMANCE: {
    spatialGridSize: 200,
    idleFPS: 30,
    useOffscreenCanvas: true,
    prefetchNextWaypoint: true,
    autoCleanOldMaps: true,
    preferWebP: true,
    logPerformanceStats: true,
    logMemoryStats: true          // 🆕 Log de memoria
  },

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