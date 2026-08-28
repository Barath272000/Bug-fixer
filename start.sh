#!/bin/bash
set -e

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

stop_existing_service 4000
stop_existing_service 3000

# Ensure Postgres and Redis are up
cd backend
docker compose up postgres redis -d

# Cleanup: kill both processes when this script exits (e.g. Ctrl+C)
cleanup() {
  echo "Stopping backend and frontend..."
  kill "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null
  exit 0
}
trap cleanup SIGINT SIGTERM

# Start backend
cd /workspaces/Bug-fixer/backend
npm run dev &
BACKEND_PID=$!

# Start frontend
cd /workspaces/Bug-fixer/frontend
npm run dev -- --strictPort &
FRONTEND_PID=$!

echo "Backend running (PID $BACKEND_PID) on http://localhost:4000"
echo "Frontend running (PID $FRONTEND_PID) on http://localhost:3000"
echo "Press Ctrl+C to stop both."

wait
