# Hackémon — Mundo CTF estilo Pokémon

Juego dockerizado (mapa, captura de criaturas, inventario) con 12 retos de
red / forense / web. Laboratorio **aislado**: todo se publica solo en
`127.0.0.1`. Úsalo únicamente contra este laboratorio.

## Arrancar

Con Docker Desktop abierto (ballena en verde / *Engine running*):

```powershell
docker compose up --build -d
```

- Juego: http://localhost:8080
- Sitio objetivo de los retos web: http://localhost:8081

Controles: **flechas / WASD** mover · **Espacio** abrir una cápsula/reto ·
**I** inventario · **Esc** cerrar. Para pasar de zona hay que capturar 3
criaturas de la zona anterior (un guardia bloquea el puente).

## Retos de red locales (5 y 6)

Realiza estos ejercicios únicamente en máquinas virtuales propias o autorizadas,
conectadas a una red **Host-Only** aislada. El reto 5 descubre hosts del segmento
`192.168.56.0/24`; el reto 6 identifica Apache en el puerto 80 de la IP objetivo
que encontraste, usando `sudo nmap -sS -sV -p 80 <IP_OBJETIVO>`. No ejecutes
estos escaneos contra redes públicas o equipos ajenos.

## Editar y ver los cambios

- **El juego** está dividido por responsabilidad en `app/static/`:
  - `index.html`: estructura de la página y menú de inicio.
  - `game.css`: estilos y diseño visual.
  - `game.js`: mapa, movimiento, animaciones, inventario y retos.
  Gracias al volumen del `docker-compose.yml`, edita los archivos, guarda y
  **refresca el navegador** (`Ctrl+F5`). No hace falta reconstruir.
- **El backend en Python** (`app/main.py`, `app/retos.py`, `app/artefactos.py`)
  va dentro de la imagen, así que ahí sí reconstruye:
  ```powershell
  docker compose up --build -d
  ```

## Parar / reiniciar

```powershell
docker compose down            # detener
docker compose up --build -d   # levantar de nuevo
```

## Estructura

```
ctf-mundo/
  docker-compose.yml     # orquesta el contenedor + volumen de edición en vivo
  Dockerfile
  app/
    main.py              # servidor del juego (8080) + sitio objetivo (8081) + servicios TCP
    retos.py             # definición de los 12 retos y sus banderas
    artefactos.py        # genera los archivos descargables (pcaps, hash, imagen)
    static/
      index.html         # estructura de la página y menú de inicio
      game.css           # estilos y diseño visual
      game.js            # lógica, mapa, sprites y animaciones
```
