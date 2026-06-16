# Grid de implicados — Expediente 0001 (estado al 14/06/2026)

Generado desde `personas.json` + el audit_gaps.py corrido por el editor. Sirve para dos cosas: (1) referencia rápida de "quién es quién" para quien escriba contenido, (2) tracker de qué falta para cerrar prioridad 1.

## Perfil base (= `caseRole` en personas.json, va en `involved[].role` SIEMPRE igual, en todas las fases/waypoints donde aparece esa persona)

| id | Nombre | Avatar | Rol base (`caseRole`) |
|---|---|---|---|
| `robles_murillo` | Pablo Antonio Robles Murillo | `/assets/pablo-anotonio-robles-murillo.webp` | Señalado como presunto autor intelectual ("cerebro") |
| `chaves_medina` | Danilo José Chaves Medina | `/assets/danilo-jose-chavez-medina.webp` | Intermediario entre los autores materiales e intelectuales |
| `carvajal` | Luis Fernando Carvajal Fernández | `/assets/luis-fernando-carvajal-fernandez.webp` | Señalado como gatillero |
| `robles_salas` | Bryan Steven Robles Salas | `/assets/bryan-steven-robles-salas.webp` | Conductor / vigilancia |
| `orozco` | Luis Ricardo Orozco González | `/assets/luis-ricardo-orozco-gonzales.webp` | Transportista de extracción |
| `chacon` | Stephanie María Chacón Guillén | `/assets/stephanie-maria-chacon-guillen.webp` | Señalada como facilitadora financiera |
| `navarrete` | Keny Hosman Navarrete Vallecillo ("Chatel") | `/assets/keny-hosman-navarrete-vallecillo.webp` | Señalado como coordinador del encargo desde prisión |

## Dónde aparece cada uno (`involved[]` real, post-rename)

| id | F1 (wp0–5) | F2 (wp0–5) | F3 (wp0–11) | Total |
|---|---|---|---|---|
| `robles_murillo` | wp0–5 (elenco fijo) | — | — | 6 |
| `chaves_medina` | wp0–5 (elenco fijo) | wp0–5 (elenco fijo) | wp1, wp2, wp9 | 15 |
| `carvajal` | wp0–5 (elenco fijo) | wp0–5 (elenco fijo) | wp0, wp4, wp5, wp6, wp7, wp8, wp11 | 19 |
| `robles_salas` | — | wp0–5 (elenco fijo) | wp0, wp4, wp6, wp7, wp8, wp10 | 12 |
| `orozco` | — | — | wp2–wp10 (escena) | 9 |
| `chacon` | — | — | wp9 | 1 |
| `navarrete` | — | — | — | 0 |

`navarrete` y `robles_murillo` solo viven en el `brief` de `story.json` por ahora (el primero ni eso). Sin acción requerida — son personajes que el expediente nombra pero que no participan en la línea de tiempo operativa de f1-f3 (ver `_placement` en `personas.json`).

## Lo que falta para cerrar prioridad 1 (`echos` + captions tipo B)

| Bloque | Estado | Pendiente |
|---|---|---|
| F1 wp0–wp1 `echos` | ✓ completos | — |
| F1 wp2–wp5 `echos` | ✓ completos (12) | — |
| F2 wp0–wp5 `echos` | ✓ completos (18) | — |
| F3 wp0–wp11 `echos` | ✓ completos | — |
| F1 wp2–wp5 captions tipo B | ❌ lorem ipsum | depende de imágenes reales (no es texto que se pueda inventar) |
| F2 wp2–wp5 captions tipo B | ❌ lorem ipsum | depende de imágenes reales |
| F3 todos captions tipo B | ❌ TODO | depende de imágenes reales |

**30 bloques de `echos` escritos** (12 en F1, 18 en F2). Prioridad 1 cerrada en texto. Lo único que falta en todo el proyecto son las **captions tipo B** (lorem ipsum / TODO), que dependen de que editorial suba las imágenes reales — no de redacción.

---

*Este archivo es un snapshot, no se actualiza solo. Re-generar corriendo `audit_gaps.py` cada vez que se agregue contenido nuevo, y actualizar `personas.json` (`appearsIn`, `_echosStatus`) + esta tabla en consecuencia.*
