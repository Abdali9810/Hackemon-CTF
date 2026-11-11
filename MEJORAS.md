# Plan de mejoras — rama `mejoras`

Cada mejora es **un commit independiente y desacoplado**: se puede hacer
`git cherry-pick <sha>` de cualquiera, descartar las demás y probar
combinaciones. Ninguna depende de otra (donde dos mejoras podrían compartir
código, cada una trae lo suyo o usa APIs ya existentes en `main`).

Orden sugerido de implementación (número = número de commit propuesto):

---

## M1 · Jingle de victoria al capturar la bandera

**Estado actual**: `sfx.caught()` en `game-audio.js` ya toca una fanfarria
corta de 6 notas durante la animación de captura (`encSfx`, `k===195`).

**Cambio**: sustituir/extender `caught()` por un jingle de victoria más
completo estilo Pokémon (dos frases: arpegio de captura + resolución mayor),
manteniendo la misma firma de función para no tocar `game.js`.

- Archivos: `app/static/game-audio.js` (solo la función `caught()`).
- Desacoplamiento: cambio interno a una función ya llamada; cero cambios
  fuera de `game-audio.js`.

## M2 · Frontend de CorpX (sitio 8081) con estética del juego

**Estado actual**: el "objetivo" en `main.py` devuelve HTML plano inline
(`home`, `portal`, `backup`, `api/flag`): texto negro sobre blanco.

**Cambio**: darle identidad visual tipo juego — tema oscuro, bordes pixelados,
fuente monoespaciada, logo "CorpX Intranet", scanlines sutiles — pero sin
cambiar ni una línea de lógica (mismas rutas, mismo SQLi, mismas respuestas).

- Archivos: `app/main.py` (solo strings HTML) + `app/corpx.css` nuevo
  servido por la app `obj` (ruta `/corpx.css`).
- Requiere rebuild (`docker compose up --build -d`) porque `main.py` va
  dentro de la imagen.
- Desacoplamiento: un solo commit; si se descarta, el sitio vuelve a ser
  HTML plano sin romper nada.

## M3 · Viento en pasto y árboles

**Estado actual**: `tile(v,x,y,tx,ty)` dibuja tiles estáticos; existe `tm`
(contador de frames global en `loop()`).

**Cambio**: en `tile()`, para los tiles de hierba y copas de árbol, dibujar 2-3
detalles (brújulas de hojas, píxeles de brillo) cuya posición se desplace con
`Math.sin(tm/20 + x*0.7 + y*0.3)` — vaiven leve, distinto por tile para que no
se mueva todo en bloque. Coste casi nulo (solo se dibujan tiles visibles).

- Archivos: `app/static/game.js` (función `tile()` únicamente).
- Desacoplamiento: si se descarta, el mapa vuelve a ser estático.

## M4 · Transición al entrar al reto

**Estado actual**: `interact()` ya lanza `mode='enc'` con `kind:'open'`:
cápsula volando + flash blanco → `openPanel(r)`.

**Cambio**: antes de la cápsula, añadir una "transición de batalla" estilo
Pokémon en el canvas: barras horizontales alternadas que cierran la pantalla
con el color de zona `ZC[r.zona]` + flash → entonces la animación actual.
Refuerza la sensación de "entrar a otro lugar".

- Archivos: `app/static/game.js` (rama `kind==='open'` de `enc()` y fase
  inicial; opcionalmente `encSfx` con un "whoosh" reutilizando `sfx.throw()`).
- Desacoplamiento: si se descarta, queda la animación actual.

## M5 · Medallas por zona completada

**Estado actual**: hay puntos (`score()`, `earned()`, penalización por
pistas) pero **no existe** sistema de medallas/logros.

**Cambio**: al capturar la 4ª criatura de una zona → medalla:
`Ruta Césped` → "Medalla Lupa" (forense), `Bosque de Redes` → "Medalla
Paquete" (red), `Cumbre Root` → "Medalla Root" (web). Implementación:

- `S.medals` en el estado persistido (`ctfm1` en localStorage).
- Detección en `captureSuccess`/`continueAfterCapture` (donde ya se calcula
  `nz(z)`) → toast "¡Medalla conseguida!" + `sfx.caught()` (ya existe, así
  M5 no depende de M1).
- Visual: 3 insignias en el HUD junto al contador y/o una fila de medallas en
  el inventario; sprite pixel de 10px dibujado en canvas como `mk()`.

- Archivos: `app/static/game.js` + `app/static/game.css` (estilos HUD/inv).
- Desacoplamiento: todo el código nuevo vive en bloques propios.

## M6 · Distintivos temáticos por zona

**Estado actual**: zonas separadas por x (`P.x<240` z1, `<496` z2, resto z3)
con color de cápsula por zona, pero el decorado es genérico (pasto, árboles,
agua, camino).

**Cambio**: overlays decorativos por zona, dibujados en `drawMap()` sobre los
tiles (sin cambiar el array de mapa `T`):

- **Z1 "Ruta Césped"** (forense/OSINT): lupas, llaveros/notas, huellas.
- **Z2 "Bosque de Redes"** (red): nodos con cableado, antenitas, "paquetes"
  (cuadraditos) viajando entre nodos.
- **Z3 "Cumbre Root"** (web/root): terminales `>_`, candados, calaveras
  pixeladas en rocas.

Sprites pixel de ~10×10 en el mismo estilo que `mk()`. Posiciones fijas
sembradas por coordenada para que sean deterministas.

- Archivos: `app/static/game.js` (una función `decor(z,tx,ty)` llamada desde
  `drawMap()`; el resto intacto).
- Desacoplamiento: si se descarta, queda el mapa actual. Compatible con M3.

## M7 · Normalización de flags (el tema del reto 1)

**Diagnóstico**:

| Reto | Flag esperada (servidor) | Qué acepta el juego |
|------|--------------------------|---------------------|
| 1 | `CORPX{foca_en_los_metadatos}` | solo el interior; el cliente envuelve |
| 2 | `2600:3c01:e000:3e6::6d4e:7061` | IPv6 cruda (no es formato CORPX) |
| 3-12 | `CORPX{...}` | flag completa |

**Recomendación**: NO envolver el reto 2 en `CORPX{}` — semánticamente es una
respuesta técnica (identificar una IPv6), no una flag; forzar
`CORPX{2600:...}` sería raro y cambiaría el valor "correcto".

Lo que sí se estandariza es la **aceptación**: que en todos los retos de tipo
flag valga escribir `foca_en_los_metadatos` o `CORPX{foca_en_los_metadatos}`
(indistinto, sin importar mayúsculas del prefijo). Hoy escribir la flag
completa en el reto 1 *falla* — es una trampa de UX.

**Cambio**: en `game.js`, helper `norm()` que recorta espacios, quita el
envoltorio `CORPX{...}` si viene, y reconstruye el formato canónico según el
reto (retos ≠2 → `CORPX{inner}`; reto 2 → crudo). Placeholder uniforme
`CORPX{...}` para 3-12 y se elimina el caso especial del reto 1.

- Archivos: `app/static/game.js` (handler `#bv` + placeholder del `#fl`).
- Desacoplamiento: pura UX; no toca `retos.py`, ni flags, ni el servidor.

---

## Extras propuestos (votar antes de implementar)

- **E1 · Banner de zona**: al cruzar el límite x=240 / x=496, cartel
  "Entrando a Bosque de Redes" 1-2 s (toast con estilo de cartel Pokémon).
- **E2 · Ráfaga de confeti/sparks** al aparecer la medalla o al completar las
  12: partículas de `ZC[z]` en el canvas de la pantalla de resultado.
- **E3 · Pantalla de fin de juego**: al capturar la 12ª, panel "¡Liga
  Hackémon completada!" con score total, pistas usadas y tiempo — hoy solo
  sale un toast.
- **E4 · Minimapa** en el HUD con la posición del jugador y cápsulas.

## Verificación

- `static/` va montado por volumen: editar → `Ctrl+F5` en el navegador.
- Solo M2 (toca `main.py`) exige `docker compose up --build -d`.
- Cada commit se prueba igual: levantar, abrir 127.0.0.1:8080, capturar un
  reto de la zona afectada.
