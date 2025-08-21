#!/usr/bin/env bash
# Simple one-command startup for MyWork using Docker Compose
# Usage:
#   1) Make executable once: chmod +x start.sh
#   2) Run: ./start.sh
#
# Requirements: Docker Desktop (or Docker Engine) with Docker Compose
# This script will:
#   - Check Docker/Compose availability
#   - Build and start LocalStack, backend, and frontend containers
#   - Wait until services are reachable
#   - Open the app in your default browser (macOS/Linux)

set -Eeuo pipefail

APP_NAME="MyWork"
BACKEND_URL="http://localhost:8001"
FRONTEND_URL="http://localhost:3001"

log()  { echo -e "[$APP_NAME] $*"; }
err()  { echo -e "[$APP_NAME][ERROR] $*" >&2; }
have() { command -v "$1" >/dev/null 2>&1; }

ensure_docker() {
  if ! have docker; then
    err "Docker is not installed. Install Docker Desktop: https://www.docker.com/products/docker-desktop/"
    exit 1
  fi
  # Check if Docker daemon is running
  if ! docker info >/dev/null 2>&1; then
    err "Docker daemon is not running. Please start Docker Desktop and try again."
    exit 1
  fi
}

detect_compose() {
  if docker compose version >/dev/null 2>&1; then
    echo "docker compose"
    return 0
  fi
  if have docker-compose; then
    echo "docker-compose"
    return 0
  fi
  err "Docker Compose not found. Install/upgrade Docker Desktop to get 'docker compose'."
  exit 1
}

wait_for_http() {
  local url="$1"
  local name="$2"
  local timeout="${3:-240}" # seconds
  local elapsed=0

  printf "[$APP_NAME] Waiting for %s at %s" "$name" "$url"
  until curl -fsS "$url" >/dev/null 2>&1; do
    sleep 2
    elapsed=$((elapsed+2))
    printf "."
    if [ "$elapsed" -ge "$timeout" ]; then
      echo
      err "Timed out waiting for $name to become ready at: $url"
      exit 1
    fi
  done
  echo " done"
}

open_browser() {
  local url="$1"
  if have open; then
    # macOS
    open "$url" >/dev/null 2>&1 || true
  elif have xdg-open; then
    # Most Linux distros
    xdg-open "$url" >/dev/null 2>&1 || true
  fi
}

main() {
  log "Checking Docker environment..."
  ensure_docker
  COMPOSE_CMD="$(detect_compose)"

  log "Starting containers (this may take a few minutes on first run)..."
  $COMPOSE_CMD up -d --build

  log "Containers are starting. Checking service readiness..."
  # Backend FastAPI docs endpoint is a good readiness signal
  wait_for_http "${BACKEND_URL}/docs" "Backend (FastAPI)"
  # Frontend root should return 200/redirect once Next.js is up
  wait_for_http "${FRONTEND_URL}" "Frontend (Next.js)"

  log "All services are up!"
  echo
  echo "----------------------------------------"
  echo " Backend:  ${BACKEND_URL}  (API docs: ${BACKEND_URL}/docs)"
  echo " Frontend: ${FRONTEND_URL}"
  echo "----------------------------------------"
  echo
  log "Opening the app in your default browser..."
  open_browser "${FRONTEND_URL}"

  echo
  log "To view logs:        $COMPOSE_CMD logs -f"
  log "To stop everything:  $COMPOSE_CMD down"
}

main "$@"
