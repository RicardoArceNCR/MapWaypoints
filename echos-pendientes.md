# Echos pendientes — F1 wp2–wp5 y F2 wp0–wp5

30 bloques. Cada uno va dentro del objeto `echos{}` del hotspot H0 del waypoint correspondiente, como una nueva key (el `id` de la persona) con un array de un elemento. Mismo formato/tono que los `echos` ya existentes en F1 wp0/wp1 y en F3.

---

## mapa_f1_icons/icons.json

### wp2 — "Inicia la vigilancia final de los presuntos responsables" (18/06/2025, 16:17 h)

```json
"echos": {
  "robles_murillo": [
    {
      "datetime": { "date": "18/06/2025", "time": "—" },
      "description": "Según el expediente, Robles Murillo es un exmilitar del batallón Sócrates Sandino, entrenado —de acuerdo con información confidencial— en Cuba y Rusia en labores de inteligencia, asesinato y sabotaje. Esa formación es parte de lo que la investigación señala al describirlo como el presunto cerebro de la operación."
    }
  ],
  "chaves_medina": [
    {
      "datetime": { "date": "18/06/2025", "time": "16:17 h" },
      "description": "Horas antes, Chaves Medina había recibido de manos de Orozco González el Hyundai celeste (placa 903056), en teoría para hacer un trámite. Según la reconstrucción, es él quien lo conduce de regreso hacia León XIII, el mismo vehículo que al día siguiente sería usado para extraer a los ejecutores tras el ataque."
    }
  ],
  "carvajal": [
    {
      "datetime": { "date": "18/06/2025", "time": "16:17 h" },
      "description": "Mientras el Hyundai celeste ingresaba a León XIII, el dispositivo de Carvajal Fernández —ya a bordo del Renault Duster blanco— continuaba el patrón de recorridos de vigilancia por los alrededores de la vivienda de Samcam en Moravia, que se documenta en el siguiente punto del recorrido."
    }
  ]
}
```

### wp3 — "Aparece el Renault Duster Blanco" (18/06/2025, ~16:19–17:43 h)

```json
"echos": {
  "robles_murillo": [
    {
      "datetime": { "date": "18/06/2025", "time": "—" },
      "description": "La investigación lo vincula con la cúpula del Ejército de Nicaragua y, en particular, con el general Julio César Avilés. Según el expediente, ese vínculo es parte de la base sobre la que se sostiene la hipótesis de que el crimen respondió a una orden externa."
    }
  ],
  "chaves_medina": [
    {
      "datetime": { "date": "18/06/2025", "time": "—" },
      "description": "Vecino de León XIII y de oficio barbero —conocido en la zona como 'Dani Peluqueris'—, Chaves Medina es señalado por el OIJ como el intermediario que mantenía el contacto entre la célula que recorría Moravia en el Duster y quienes coordinaban la logística desde León XIII."
    }
  ],
  "carvajal": [
    {
      "datetime": { "date": "18/06/2025", "time": "—" },
      "description": "Vecino de León XIII, de 20 años, Carvajal Fernández es, según el expediente, quien se desplaza en este Renault Duster blanco (placa BKK190) realizando los recorridos de vigilancia que se documentan entre el 16 y el 18 de junio cerca de la vivienda de Samcam."
    }
  ]
}
```

### wp4 — "Reunión de coordinación final para el asesinato" (18/06/2025, 17:54–18:23 h)

```json
"echos": {
  "robles_murillo": [
    {
      "datetime": { "date": "18/06/2025", "time": "—" },
      "description": "El expediente lo menciona como posible coordinador de reuniones previas al crimen, sin que exista una imputación formal por ello. La reunión que se documenta en este punto —entre el Duster, el Hyundai y la motocicleta— es, para la investigación, parte de la logística final que se le atribuye haber puesto en marcha."
    }
  ],
  "chaves_medina": [
    {
      "datetime": { "date": "18/06/2025", "time": "17:54 – 18:23 h" },
      "description": "En esta reunión en la Estación de Servicio Delta confluyen los tres vehículos de la célula: el Duster, el Hyundai que Chaves Medina había devuelto horas antes y la motocicleta Freedom roja. Según el expediente, aquí se terminan de afinar los roles que cada uno cumpliría al día siguiente."
    }
  ],
  "carvajal": [
    {
      "datetime": { "date": "18/06/2025", "time": "17:54 – 18:23 h" },
      "description": "Carvajal Fernández llega a este punto a bordo del Renault Duster, que según el expediente se dirige desde Moravia hasta la Estación de Servicio Delta para esta reunión, el último encuentro de coordinación antes del ataque del día siguiente."
    }
  ]
}
```

### wp5 — "Todo listo para asesinar a Samcam" (18/06/2025, 19:04 h)

```json
"echos": {
  "robles_murillo": [
    {
      "datetime": { "date": "18/06/2025", "time": "—" },
      "description": "Según el expediente, Robles Murillo no ha vuelto a Costa Rica desde el 7 de agosto de 2025. Es mencionado en la causa pero no está imputado formalmente: su nombre aparece dentro de la línea de investigación sobre quién ordenó el crimen, una pregunta que el caso deja abierta incluso tras la acusación de junio de 2026."
    }
  ],
  "chaves_medina": [
    {
      "datetime": { "date": "18/06/2025", "time": "19:04 h" },
      "description": "La antena 'León XIII' que se activa en este punto corresponde al sector donde reside Chaves Medina. Para el OIJ, este registro —junto con el resto de la actividad telefónica de ese día— forma parte de la reconstrucción de los movimientos de la célula la noche previa al ataque."
    }
  ],
  "carvajal": [
    {
      "datetime": { "date": "18/06/2025", "time": "19:04 h" },
      "description": "Según el expediente, es el propio dispositivo de Carvajal Fernández el que activa esta antena, 'León XIII', coincidente con el sector de residencia de los sospechosos. Para la investigación, este registro cierra el período de vigilancia preoperativa documentado en esta fase."
    }
  ]
}
```

---

## mapa_f2_icons/icons.json

(ids ya renombrados: `chaves_medina`, `carvajal`, `robles_salas`)

### wp0 — "Día D: La ejecución de Samcam" (19/06/2025, por la mañana)

```json
"echos": {
  "chaves_medina": [
    {
      "datetime": { "date": "19/06/2025", "time": "—" },
      "description": "Tras la reunión de coordinación de la noche anterior, este es el día en que, según el expediente, Chaves Medina pasaría de las labores de vigilancia e intermediación a un rol operativo directo: horas más tarde conduciría uno de los vehículos de la huida."
    }
  ],
  "carvajal": [
    {
      "datetime": { "date": "19/06/2025", "time": "—" },
      "description": "Para Carvajal Fernández, de 20 años, este es el día en que culmina el período de vigilancia documentado en la fase anterior. Según el OIJ, es a partir de esta mañana que su rol señalado pasa de la vigilancia a la ejecución."
    }
  ],
  "robles_salas": [
    {
      "datetime": { "date": "19/06/2025", "time": "—" },
      "description": "Bryan Steven Robles Salas, de 23 años y vecino de León XIII, abre esta fase: según el expediente, es quien conduce la motocicleta que sale de León XIII al inicio de la mañana, en el primer movimiento documentado del Día D."
    }
  ]
}
```

### wp1 — "Otro sicario sale en motocicleta a matar" (19/06/2025, 06:29 h)

```json
"echos": {
  "robles_salas": [
    {
      "datetime": { "date": "19/06/2025", "time": "06:29 h" },
      "description": "Según el expediente, Robles Salas conduce la motocicleta Freedom roja que sale de León XIII, sector donde reside, a las 6:29 h de la mañana — el primer vehículo de la célula en moverse este día."
    }
  ],
  "chaves_medina": [
    {
      "datetime": { "date": "19/06/2025", "time": "06:29 h" },
      "description": "Mientras la motocicleta salía de León XIII, Chaves Medina —según la reconstrucción del OIJ— se encontraba ya posicionado junto al resto de la célula, lista para los cambios de posición que se documentan en el siguiente punto del recorrido."
    }
  ],
  "carvajal": [
    {
      "datetime": { "date": "19/06/2025", "time": "06:29 h" },
      "description": "A esta hora, según el expediente, Carvajal Fernández permanecía en el Renault Duster, donde había pasado buena parte de la vigilancia de los días previos, a la espera de los cambios de posición que ocurrirían poco después."
    }
  ]
}
```

### wp2 — "Cambio de roles y ajuste de posiciones finales" (19/06/2025, 06:37–07:41 h)

```json
"echos": {
  "carvajal": [
    {
      "datetime": { "date": "19/06/2025", "time": "06:37 – 07:41 h" },
      "description": "Según la reconstrucción del OIJ, en este punto Carvajal Fernández —identificado por la investigación como el presunto gatillero, con suéter gris— sube como pasajero a la motocicleta durante los cambios de posición previos al ataque."
    }
  ],
  "robles_salas": [
    {
      "datetime": { "date": "19/06/2025", "time": "07:41 h" },
      "description": "A las 7:41 h, según el expediente, Robles Salas pasó a conducir el Renault Duster BKK190 — el vehículo que, minutos después, se dirigiría al Condominio Naples."
    }
  ],
  "chaves_medina": [
    {
      "datetime": { "date": "19/06/2025", "time": "07:41 h" },
      "description": "En el mismo cambio de las 7:41 h, Chaves Medina —con camisa color mostaza, según la reconstrucción— pasó a conducir la motocicleta, completando el último ajuste de posiciones antes del ataque."
    }
  ]
}
```

### wp3 — "El presunto gatillero se ubica cerca de la escena" (19/06/2025, minutos antes de las 07:44 h)

```json
"echos": {
  "carvajal": [
    {
      "datetime": { "date": "19/06/2025", "time": "—" },
      "description": "Este es el momento que el expediente describe con mayor precisión sobre Carvajal Fernández: minutos antes del ataque, su dispositivo activó la radio base 'Valla Moravia', lo que según el OIJ ubicaría su teléfono en el sector del homicidio."
    }
  ],
  "robles_salas": [
    {
      "datetime": { "date": "19/06/2025", "time": "—" },
      "description": "Según la reconstrucción, a esta hora Robles Salas ya conducía el Renault Duster BKK190 con Carvajal Fernández como pasajero delantero, acercándose al Condominio Naples donde minutos después ocurriría el ataque."
    }
  ],
  "chaves_medina": [
    {
      "datetime": { "date": "19/06/2025", "time": "—" },
      "description": "Mientras el Duster se acercaba a la escena, Chaves Medina —según el expediente— se desplazaba en la motocicleta por una ruta separada, en la posición que mantendría durante el ataque y la huida inmediata."
    }
  ]
}
```

### wp4 — "Samcam recibe el ataque mortal" (19/06/2025, 07:44 h)

```json
"echos": {
  "carvajal": [
    {
      "datetime": { "date": "19/06/2025", "time": "07:44 h" },
      "description": "Según la reconstrucción del OIJ, es Carvajal Fernández —identificado por la investigación como el pasajero delantero del Duster— quien desciende del vehículo, ingresa al condominio, llama a la víctima por su nombre y le habría disparado varias veces, antes de correr de vuelta al automóvil."
    }
  ],
  "robles_salas": [
    {
      "datetime": { "date": "19/06/2025", "time": "07:44 h" },
      "description": "Mientras el ataque ocurría, según el expediente Robles Salas permanecía al volante del Renault Duster, estacionado frente al Condominio Naples, a la espera de que Carvajal Fernández regresara al vehículo."
    }
  ],
  "chaves_medina": [
    {
      "datetime": { "date": "19/06/2025", "time": "07:44 h" },
      "description": "En este momento, según la reconstrucción, Chaves Medina se encontraba en la motocicleta, en una posición separada del Duster — el punto desde el cual, segundos después, ambos vehículos iniciarían la huida por rutas distintas."
    }
  ]
}
```

### wp5 — "Inicia la huida" (19/06/2025, inmediatamente después de las 07:44 h)

```json
"echos": {
  "carvajal": [
    {
      "datetime": { "date": "19/06/2025", "time": "—" },
      "description": "Según el expediente, Carvajal Fernández —señalado como el presunto gatillero— huye a bordo del Renault Duster, que se aleja a gran velocidad del Condominio Naples inmediatamente después del ataque."
    }
  ],
  "robles_salas": [
    {
      "datetime": { "date": "19/06/2025", "time": "—" },
      "description": "Robles Salas, según la reconstrucción del OIJ, es quien conduce el Renault Duster en esta huida inicial — el mismo vehículo que horas más tarde sería abandonado en Coronado, como se documenta en la siguiente fase."
    }
  ],
  "chaves_medina": [
    {
      "datetime": { "date": "19/06/2025", "time": "—" },
      "description": "Chaves Medina, según el expediente, huye por una ruta separada en la motocicleta, de regreso hacia Tibás/León XIII — un trayecto que se reconstruye con más detalle al inicio de la fase 3."
    }
  ]
}
```

---

## Notas para tu editor

- Cada bloque de arriba es el contenido de la key `echos` completa del hotspot H0 de ese `wp`. Si el hotspot **ya tiene** una key `echos` (vacía `{}`), reemplazarla por este objeto. Si no existe la key, agregarla al hotspot.
- No toca `involved`, `title`, `description`, geometría ni los hotspots tipo B — solo agrega `echos`.
- Con esto, **F1 y F2 quedan con `echos` completos igual que F3** (ver `grid-implicados.md`, que debería actualizarse después: las filas "F1 wp2-5 pendientes" y "F2 wp0-5 pendientes" pasan a ✓).
- Las captions tipo B (lorem ipsum en F1 wp2-5/F2 wp2-5, TODO en F3) siguen pendientes — eso depende de imágenes reales, no de texto.
