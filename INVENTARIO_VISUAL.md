# Inventario técnico visual — Hackémon CTF

**Fecha de revisión:** 13 de noviembre de 2026  
**Alcance principal:** aplicación que se construye desde la raíz del repositorio con `docker compose`, usando `app/` y `app/static/`.

Este documento registra las tecnologías y recursos visuales identificables en el código fuente. Es una revisión técnica del repositorio, no una certificación legal de autoría, licencias o procedencia de cada recurso.

## Tecnologías de interfaz

| Área | Tecnología utilizada | Uso observado |
|---|---|---|
| Estructura | HTML5 | Pantallas de inicio e historia, selección de entrenador, menús, formularios y regiones accesibles. |
| Estilos | CSS nativo | Diseño, paleta, paneles, botones, disposición adaptable, animaciones y representación pixelada del canvas. |
| Interactividad | JavaScript nativo (sin framework de interfaz) | Lógica del juego, interacción con pantallas, dibujos, animaciones y comunicación con la API. |
| Gráficos | HTML Canvas 2D | Mapa, minimapa, personajes, criaturas, medallas, efectos y vistas previas. |
| Iconografía | SVG en línea y caracteres de texto | Dibujos de accesorios del entrenador y símbolos de menú/sonido. |
| Audio | Web Audio API del navegador | Música, ambiente y efectos sintetizados mediante osciladores, filtros y ruido; no se cargan pistas de audio externas en la interfaz. |
| Tipografías | Google Fonts | `Press Start 2P` y `VT323`, con alternativas monospace declaradas en CSS. |
| Imágenes de retos | Pillow (`PIL`) | Generación en Python de imágenes PNG descargables para retos, incluyendo metadatos de práctica. No es una dependencia del renderizado de la interfaz. |

No se encontraron referencias en la interfaz principal a bibliotecas JavaScript como React, Vue, jQuery, Phaser, PixiJS, Bootstrap o Tailwind. Tampoco se encontró un paso de compilación de frontend o un gestor de paquetes JavaScript en el alcance revisado.

## Recursos y tratamiento visual

- **Estilo:** aventura de criaturas con estética retro/pixel art.
- **Resolución lógica del mapa:** canvas de `240 × 160` píxeles, con tiles de `16 × 16`; el mapa lógico es de `48 × 32` tiles.
- **Escalado:** CSS conserva la proporción del área de juego y usa `image-rendering: pixelated` para mantener bordes nítidos.
- **Dibujo generado por código:** las criaturas, el mapa, los personajes, los NPC, las medallas y los efectos se dibujan mediante Canvas 2D. Las criaturas se generan en canvas auxiliares y se convierten a imágenes de datos para mostrarlas en el inventario.
- **Fondos y componentes:** gradientes, transparencias, bordes, sombras, paneles y tarjetas están definidos en CSS.
- **Diseño adaptable:** reglas CSS ajustan la interfaz según el ancho y la altura de la ventana. Hay una preferencia `prefers-reduced-motion` para desactivar la animación de entrada, además de etiquetas ARIA y controles semánticos en HTML.
- **Paleta representativa:** fondo oscuro verde `#0f1a14`, panel `#16241c`, texto claro `#e8f0e0`, acento menta `#9be8c8`, verde de acción `#2f8f5b` y amarillo de énfasis `#f8d030`. El juego también emplea acentos por zona.

## Tipografías y dependencias externas

La página solicita `Press Start 2P` y `VT323` desde Google Fonts. Por tanto, la descarga de esas fuentes depende de acceso a Google Fonts; si no está disponible, se aplican las fuentes monospace alternativas del sistema.

El código revisado identifica los nombres de las fuentes, pero no incluye archivos de fuente ni una copia de sus licencias. Antes de redistribuirlas localmente o publicar un paquete de fuentes, conviene verificar las licencias vigentes de cada familia tipográfica.

No se observaron archivos de audio o imágenes independientes cargados por la pantalla principal del juego. Esto no implica que todos los archivos del repositorio sean recursos de interfaz: por ejemplo, las imágenes PNG de retos se generan como artefactos descargables.

## Herramientas de generación de imágenes

`app/artefactos.py` usa **Pillow** (`PIL.Image`, `ImageDraw` y `PngInfo`) para crear PNG de `192 × 192` píxeles para retos forenses y agregarles metadatos. El `Dockerfile` instala Pillow para que esos artefactos se generen durante la construcción de la imagen.

El proyecto también instala Flask, Waitress y Scapy en el backend. No son bibliotecas de diseño visual; Scapy se usa para generar artefactos de red de los retos.

## Variantes en el repositorio

La carpeta `ctf-mundo/` contiene otra implementación de la aplicación con HTML, CSS y JavaScript nativos, y renderizado mediante Canvas 2D. La documentación principal de este inventario corresponde a `app/static/`, que es el frontend montado por el `docker-compose.yml` de la raíz. La variante `ctf-mundo/` no se considera parte de esa ejecución principal.

## Límites de esta revisión

La inspección del código permite identificar las tecnologías y recursos usados en tiempo de ejecución, pero no permite certificar qué programas se usaron durante el diseño o la creación manual. No se encontró evidencia en los archivos revisados que permita afirmar que se utilizaron Figma, Photoshop, Illustrator, Canva u otras herramientas de autoría visual. Si se utilizaron, sus nombres, versiones, licencias y contribuciones deben añadirse a este inventario con información de quien los usó.

## Archivos revisados

- `app/static/index.html`
- `app/static/game.css`
- `app/static/game.js`
- `app/static/game-audio.js`
- `app/static/corpx.css`
- `app/artefactos.py`
- `Dockerfile`
- `docker-compose.yml`
- `ctf-mundo/app/static/` (para identificar la variante alternativa)
