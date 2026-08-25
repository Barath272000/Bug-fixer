#!/bin/bash
set -e

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
npm run dev &
FRONTEND_PID=$!

echo "Backend running (PID $BACKEND_PID) on http://localhost:4000"
echo "Frontend running (PID $FRONTEND_PID) on http://localhost:3000"
echo "Press Ctrl+C to stop both."

wait
