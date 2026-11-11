# Plan de mejoras — rama `mejoras`

Cada mejora es **un commit independiente**: `git cherry-pick <sha>` de la que
quieras, descarta las demás. Ninguna depende de otra.

## M1 · Jingle de victoria al capturar

Ampliar `sfx.caught()` en `game-audio.js` a una fanfarria completa estilo
Pokémon (arpegio de captura + resolución mayor). Misma firma → `game.js` no
cambia. Solo `game-audio.js`.

## M2 · Frontend de CorpX (8081) con estética del juego

Restilar las respuestas de `main.py` (`/`, `/portal`, `/backup`,
`/api/flag`): tema oscuro, bordes pixelados, mono, logo CorpX, scanlines —
vía `app/corpx.css` nuevo servido por la app `obj`. **Sin tocar la lógica**
(mismas rutas, mismo SQLi). Única mejora que exige `up --build -d`.

## M3 · Viento en pasto y árboles

En `tile()` de `game.js`: píxeles de detalle en hierba y copas que oscilan con
`Math.sin(tm/20 + x*0.7 + y*0.3)` — vaivén leve y desfasado por tile. Solo
`game.js`.

## M4 · Transición de batalla al entrar al reto

Antes de la cápsula actual (`kind:'open'` en `enc()`): barras horizontales
alternadas en `ZC[r.zona]` que cierran la pantalla + whoosh (`sfx.throw()` ya
existe). Solo `game.js`.

## M5 · Medallas por zona completada

Al capturar la 4ª criatura de una zona: medalla (Lupa / Paquete / Root).

- `S.medals` persistido en localStorage (`ctfm1`)
- Toast "¡Medalla conseguida!" + `sfx.caught()` (no depende de M1)
- 3 insignias en el HUD + fila en inventario, sprite pixel 10px

Archivos: `game.js` + `game.css`.

## M6 · Distintivos temáticos por zona

Overlays en `drawMap()` (sin tocar el array `T`), posiciones deterministas:

- **Z1 Ruta Césped** (forense): lupas, notas, huellas
- **Z2 Bosque de Redes**: nodos cableados, antenas, paquetes viajando
- **Z3 Cumbre Root**: terminales `>_`, candados, calaveras pixeladas

Sprites 10×10 estilo `mk()`. Solo `game.js`. Compatible con M3.

## M7 · Fix de aceptación de flags (opcional)

Hoy escribir la flag **completa** en el reto 1 falla (`CORPX{CORPX{...}}`).
Normalizar input: quitar `CORPX{...}` opcional y reconstruir el formato
canónico por reto (≠2 → `CORPX{inner}`; 2 → IPv6 cruda, sin cambios de
formato). Solo `game.js`, handler `#bv`. Si no gusta, no se pickea.

## E1 · Banner de zona

Al cruzar x=240 / x=496: cartel "Entrando a Bosque de Redes" ~1.5 s. Solo
`game.js` (reusa toast con clase nueva en `game.css`).

## E2 · Confeti de victoria

Ráfaga de partículas en `ZC[z]` sobre la pantalla de captura y al ganar
medalla. Solo `game.js` (en `enc()`/capture-result).

## E3 · Pantalla de "Liga completada"

Al capturar la 12ª criatura: panel final con score, pistas usadas y tiempo —
reemplaza el toast actual solo para ese caso. `game.js` + `game.css`.

## E4 · Minimapa en HUD

Canvas pequeño con vista del mapa `T`, punto del jugador y cápsulas por zona.
`game.js` + `game.css` + `index.html` (un `<canvas>`).

## Verificación

`static/` va por volumen → `Ctrl+F5`. Solo M2 pide rebuild.
