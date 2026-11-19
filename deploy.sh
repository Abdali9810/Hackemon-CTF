#!/usr/bin/env bash
# =============================================================================
# deploy.sh  —  Hackemon CTF  —  Script de despliegue para Linux / VM
# =============================================================================
# Uso:
#   ./deploy.sh               -> construye la imagen y levanta el contenedor
#   ./deploy.sh --load        -> carga la imagen desde hackemon-ctf.tar y levanta
#   ./deploy.sh --stop        -> detiene y elimina el contenedor
#   ./deploy.sh --logs        -> muestra los logs en tiempo real
#   ./deploy.sh --server      -> modo servidor central (expone en 0.0.0.0)
# =============================================================================
set -euo pipefail

IMAGE="hackemon-ctf:latest"
CONTAINER="ctf-mundo"
TAR="hackemon-ctf.tar"

# ── Colores ──────────────────────────────────────────────────────────────────
GRN='\033[0;32m'; YLW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
info()  { echo -e "${GRN}[+]${NC} $*"; }
warn()  { echo -e "${YLW}[!]${NC} $*"; }
error() { echo -e "${RED}[x]${NC} $*"; exit 1; }

# ── Verificar dependencias ───────────────────────────────────────────────────
command -v docker >/dev/null 2>&1 || error "Docker no encontrado. Instálalo primero: https://docs.docker.com/engine/install/"

# ── Parsear argumentos ───────────────────────────────────────────────────────
MODE="build"
SERVER_MODE=false

for arg in "$@"; do
  case $arg in
    --load)   MODE="load"   ;;
    --stop)   MODE="stop"   ;;
    --logs)   MODE="logs"   ;;
    --server) SERVER_MODE=true ;;
    --help|-h)
      sed -n '3,12p' "$0" | sed 's/^# //'
      exit 0
      ;;
  esac
done

# ── Modo servidor central: reemplaza 127.0.0.1 por 0.0.0.0 en compose ───────
apply_server_mode() {
  if $SERVER_MODE; then
    warn "Modo servidor: puertos expuestos en 0.0.0.0 (accesible desde la red)"
    export COMPOSE_OVERRIDE="-f docker-compose.yml -f /dev/stdin"
    # Genera override inline
    OVERRIDE=$(cat <<'EOF'
services:
  mundo:
    ports:
      - "0.0.0.0:8080:8080"
      - "0.0.0.0:8081:8081"
      - "0.0.0.0:9003:9003"
EOF
)
    echo "$OVERRIDE" > /tmp/hackemon-override.yml
    COMPOSE_CMD="docker compose -f docker-compose.yml -f /tmp/hackemon-override.yml"
  else
    COMPOSE_CMD="docker compose"
  fi
}

# ── Acciones ─────────────────────────────────────────────────────────────────
case $MODE in

  build)
    info "Verificando archivos necesarios..."
    [[ -f "FOCA-v3.4.7.1.zip" ]]            || warn "FOCA-v3.4.7.1.zip no encontrado en la raíz (reto 1 sin descarga)"
    [[ -f "informe_recon_iana_oculto.pdf" ]] || warn "informe_recon_iana_oculto.pdf no encontrado (reto 3 sin descarga)"

    info "Construyendo imagen Docker: $IMAGE"
    docker build -t "$IMAGE" .

    apply_server_mode
    info "Iniciando contenedor..."
    $COMPOSE_CMD up -d

    info "Contenedor activo. Accede al juego en:"
    echo ""
    if $SERVER_MODE; then
      IP=$(hostname -I | awk '{print $1}')
      echo "  http://$IP:8080   (juego)"
      echo "  http://$IP:8081   (objetivo web)"
    else
      echo "  http://127.0.0.1:8080   (juego)"
      echo "  http://127.0.0.1:8081   (objetivo web)"
    fi
    echo ""
    ;;

  load)
    [[ -f "$TAR" ]] || error "No se encontró $TAR. Cópialo a este directorio primero."
    info "Cargando imagen desde $TAR..."
    docker load -i "$TAR"

    apply_server_mode
    info "Iniciando contenedor..."
    $COMPOSE_CMD up -d

    info "Contenedor activo. Accede al juego en:"
    echo ""
    if $SERVER_MODE; then
      IP=$(hostname -I | awk '{print $1}')
      echo "  http://$IP:8080   (juego)"
    else
      echo "  http://127.0.0.1:8080   (juego)"
    fi
    echo ""
    ;;

  stop)
    info "Deteniendo y eliminando contenedor..."
    docker compose down
    info "Contenedor detenido."
    ;;

  logs)
    info "Mostrando logs (Ctrl+C para salir)..."
    docker compose logs -f
    ;;

esac
