# Plan de mejoras — rama `mejoras`

Cada mejora es **un commit independiente**: `git cherry-pick <sha>` de la que
quieras, descarta las demás. Ninguna depende de otra.

Leyenda: ✅ implementada · ⏳ pendiente de aprobación

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
| P2-2 | HUD solo en mapa/diálogos — ya no solapa paneles/inventario/menú | `d2c9abf` | `game.js` |
| P2-3 | Ventana responsive hasta 1440px + textos de paneles escalables | `7431d78` | `game.css` |
| P2-4 | Textos de ayuda más grandes (footer `.k`, intro `.controls`) | `a3130d2` | `game.css` |
| P2-5 | Árboles y flores con mejor pixel art (sombra, tronco, tallo, pétalos) | `f195181` | `game.js` |
| P2-6 | Peces saltando en las tiles de agua | `57bc03a` | `game.js` |
| P2-7 | NPC pescador junto al río de Z2 — bloquea paso, habla con tips + humor | `6620251` | `game.js` |
| P2-8 | Fondos de captura por zona: Z1 jardín · Z2 bosque tecnificado con paquetes de luz · Z3 desierto con dunas | `0e3b6e3` | `game.js` |

### Diálogos del pescador (`FISH_LINES`, game.js) — contenido nuevo, no original

- *Tips*: guardias/zonas · controles (Espacio, I, M, N) · costo de pistas (15 pts) · botón de descarga
- *Humor*: "recuerdo cuando solía programar y hackear redes" · "usando el cerebro y no solo la IA" · "peces sin ping" · "récord de 40 años"

# Parte 2 — pendiente de aprobación

## Ideas propuestas (aún sin aprobar)

- NPCs temáticos en Z1 (niña con lupa — tips OSINT) y Z3 (hacker — tips web).
- Medalla extra "Purista": zona completada sin usar pistas.
- Ambiente sonoro por zona en `updateAmbient` (viento Z1, zumbido Z3).
- Ciclo de iluminación suave (día/noche leve) sobre el mapa.
- Renombrar Z1 "Ruta Césped" → "Pradera Recon"/"Ruta OSINT" (su contenido es
  recon básico; "Bosque de Redes" y "Cumbre Root" sí casan con sus retos).

## Verificación

`static/` va por volumen → `Ctrl+F5`. Solo M2 pide rebuild
(`docker compose up --build -d`). Todo lo demás ya está en vivo.
