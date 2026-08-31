#!/bin/bash
set -euo pipefail

BACKEND_PORT=4000
FRONTEND_PORT=3000
APP_ROOT="/workspaces/Bug-fixer"

stop_existing_service() {
  local port="$1"
  local pid
  pid="$(lsof -t -iTCP:"$port" -sTCP:LISTEN 2>/dev/null || true)"
  if [[ -z "$pid" ]]; then
    return
  fi

  local command_line
  command_line="$(ps -p "$pid" -o command=)"
  if [[ "$command_line" == *"/workspaces/Bug-fixer/"* ]]; then
    echo "Stopping existing Bug-fixer process on port $port (PID $pid)..."
    kill "$pid" 2>/dev/null || true
    for _ in {1..20}; do
      if ! kill -0 "$pid" 2>/dev/null; then
        return
      fi
      sleep 0.1
    done
    kill -9 "$pid" 2>/dev/null || true
    return
  fi

  echo "Port $port is already used by another process (PID $pid)."
  echo "Stop it or choose a different port before running ./start.sh."
  exit 1
}

wait_for_http() {
  local url="$1"
  local name="$2"
  local max_attempts="${3:-60}"
  local attempt=1

  echo "Waiting for $name at $url..."
  while (( attempt <= max_attempts )); do
    if curl -fsS "$url" >/dev/null 2>&1; then
      echo "$name is ready at $url"
      return 0
    fi
    sleep 1
    ((attempt++))
  done

  echo "ERROR: $name did not become ready at $url within $(($max_attempts)) seconds."
  return 1
}

print_urls() {
  local local_frontend="http://localhost:${FRONTEND_PORT}"
  local local_backend="http://localhost:${BACKEND_PORT}"
  echo ""
  echo "Local URLs:"
  echo "  Frontend: $local_frontend"
  echo "  Backend:  $local_backend"

  if [[ -n "${CODESPACE_NAME:-}" && -n "${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN:-}" ]]; then
    FRONTEND_FORWARD_URL="https://${CODESPACE_NAME}-${FRONTEND_PORT}.${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}"
    BACKEND_FORWARD_URL="https://${CODESPACE_NAME}-${BACKEND_PORT}.${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}"
    echo ""
    echo "GitHub Codespace forwarded URLs:"
    echo "  Frontend: ${FRONTEND_FORWARD_URL}"
    echo "  Backend:  ${BACKEND_FORWARD_URL}"
  fi
}


stop_existing_service "$BACKEND_PORT"
stop_existing_service "$FRONTEND_PORT"

# Ensure Postgres and Redis are up
cd "$APP_ROOT/backend"
docker compose up postgres redis -d

# Cleanup: kill both processes when this script exits (e.g. Ctrl+C)
cleanup() {
  echo "Stopping backend and frontend..."
  if [[ -n "${BACKEND_PID:-}" ]]; then
    kill "$BACKEND_PID" 2>/dev/null || true
  fi
  if [[ -n "${FRONTEND_PID:-}" ]]; then
    kill "$FRONTEND_PID" 2>/dev/null || true
  fi
  exit 0
}
trap cleanup SIGINT SIGTERM

# Start backend
cd "$APP_ROOT/backend"
npm run dev > /tmp/bugfixer-backend.log 2>&1 &
BACKEND_PID=$!

# Start frontend
cd "$APP_ROOT/frontend"
npm run dev -- --strictPort > /tmp/bugfixer-frontend.log 2>&1 &
FRONTEND_PID=$!

if ! wait_for_http "http://localhost:${BACKEND_PORT}/health" "backend" 60; then
  echo "Backend log tail:"
  tail -n 80 /tmp/bugfixer-backend.log || true
  exit 1
fi

if ! wait_for_http "http://localhost:${FRONTEND_PORT}" "frontend" 60; then
  echo "Frontend log tail:"
  tail -n 80 /tmp/bugfixer-frontend.log || true
  exit 1
fi

print_urls

echo "Press Ctrl+C to stop both."
wait
