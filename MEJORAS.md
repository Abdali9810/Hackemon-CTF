# Plan de mejoras — rama `mejoras`

Este documento registra las mejoras implementadas en la rama `mejoras`.
Se conserva el alcance actual del juego: **12 retos en 3 gimnasios/zonas**.
El contenido y las soluciones de los retos 1–6 se mantienen sin cambios; las
mejoras de esta rama son principalmente visuales y de experiencia de juego.
No se incluyen planes para añadir retos ni una cuarta zona.

Cada funcionalidad se mantiene en commits separados para facilitar pruebas y
cherry-pick. Cuando una mejora depende de otra, se indica en las notas.

---

# Parte 1 — implementada

| # | Mejora | Commit | Toca |
|---|--------|--------|------|
| M1 | Jingle de victoria completo al capturar (amplía `sfx.caught()`) | `4245631` | `game-audio.js` |
| M2 | Frontend CorpX (8081) con estética del juego — sin tocar lógica/SQLi | `a23886c` | `main.py` + `corpx.css` |
| M3 | Viento en hierba, flores y copas (vaivén con `tm`) | `eb4804c` | `game.js` |
| M4 | Transición de batalla al entrar al reto (barras de zona + whoosh) | `c088356` | `game.js` |
| M5 | Medallas por zona completada: `S.medals`, toast, 3 insignias en HUD e inventario | `1049d7c` | `game.js` + `game.css` |
| M6 | Distintivos por zona — Z1 lupas/notas/huellas · Z2 nodos/antenas/paquetes · Z3 terminales/candados/calaveras | `5e61421` | `game.js` |
| M7 | Aceptar respuesta con o sin `CORPX{}` en todos los retos (reto 2 sigue siendo IPv6 cruda) | `1f306c0` | `game.js` |
| E1 | Banner con nombre de zona al cruzar áreas | `7526a1d` | `game.js` + `game.css` |
| E2 | Confeti de partículas `ZC[z]` al capturar y ganar medalla | `8a171bd` | `game.js` |
| E3 | Pantalla "Liga Hackémon completada" (score, medallas, pistas, tiempo) | `fc63b8f` | `game.js` + `game.css` + `index.html` |
| E4 | Minimapa en HUD | `37fc7f4` | `game.js` + `game.css` + `index.html` |

# Parte 2 — implementada

| # | Mejora | Commit | Toca |
|---|--------|--------|------|
| P2-1 | Minimapa: arriba-izquierda, solo en mapa, toggle con tecla **N** | `bd85bfc` | `game.js` + `game.css` + `index.html` |
| P2-2 | Ajuste inicial del HUD para evitar solapes (revisado por P2-14) | `d2c9abf` | `game.js` |
| P2-3 | Ventana responsive hasta 1440px + textos de paneles escalables | `7431d78` | `game.css` |
| P2-4 | Textos de ayuda más grandes (footer `.k`, intro `.controls`) | `a3130d2` | `game.css` |
| P2-5 | Árboles y flores con mejor pixel art (sombra, tronco, tallo, pétalos) | `f195181` | `game.js` |
| P2-6 | Peces saltando en las tiles de agua | `57bc03a` | `game.js` |
| P2-7 | NPC pescador junto al río de Z2 — bloquea paso, habla con tips + humor | `6620251` | `game.js` |
| P2-8 | Fondos de captura por zona: Z1 jardín · Z2 bosque tecnificado con paquetes de luz · Z3 desierto con dunas | `0e3b6e3` | `game.js` |
| P2-9 | NPCs por zona (sistema genérico `NPCS`): niña detective Z1 + hacker retirado Z3 + pescador Z2 | `75e4dd4` | `game.js` |
| P2-10 | Sello "Purista" por zona completada sin pistas (estrella en inventario + toast) | `95c5a33` | `game.js` + `game.css` |
| P2-11 | Ambiente sonoro por zona: zumbido grave Z3, brillo Z2 (`setZone` en HackemonMusic) | `958b460` | `game.js` + `game-audio.js` |
| P2-12 | Ciclo suave de iluminación día/noche sobre el mapa | `b817cd0` | `game.js` |
| P2-13 | Z1 renombrada "Ruta Césped" → "Pradera Recon" | `4b4869f` | `game.js` + `index.html` |
| P2-14 | Cabecera visible siempre; retos/inventario empiezan bajo el HUD (corrige enfoque de P2-2) | `8ab139a` | `game.js` + `game.css` |
| P2-15 | Pantalla inicial independiente con título, créditos, criaturas pixeladas que recorren los bordes y ondas interactivas; botón para entrar al menú de historia | local | `index.html` + `game.js` + `game.css` |
| P2-16 | Historia con efectos de criaturas y ondas, controles en lista visual y tipografía adaptable y legible sin scroll en portátiles | local | `index.html` + `game.js` + `game.css` |
| P2-17 | Selección de entrenador adaptable con habilidades visibles, gorra/moño personalizables, criaturas y ondas interactivas, botones diferenciados y vistas previas centradas | local | `index.html` + `game.js` + `game.css` |

Nota: P2-9 refactoriza el código de P2-7 (fisherPos/fisherTalk → NPCS/npcPos/npcTalk); para cherry-pick conviene tomar ambos.

### Diálogos de NPCs (game.js) — contenido nuevo, no original

- **Pescador Z2** (`FISH_LINES`): tips de guardias/controles/pistas/descargas + humor ("hackear redes", "IA jaja", "peces sin ping", "40 años")
- **Niña detective Z1** (`GIRL_LINES`): metadatos/Comment PNG, exiftool/strings, recon pasivo, "cada píxel es una pista"
- **Hacker retirado Z3** (`HACKER_LINES`): enumerar antes de atacar, comilla SQLi `admin'--`, port knocking, cabeceras, "root con paciencia"

## Verificación

Los archivos de `app/static/` se montan como volumen: refrescar con `Ctrl+F5`
para ver cambios. M2 modifica `app/main.py` y requiere rebuild con
`docker compose up --build -d`.
