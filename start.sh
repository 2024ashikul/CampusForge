#!/bin/bash

# CampusForge One-Click Startup Script

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║         CampusForge Launch Script        ║"
echo "╚══════════════════════════════════════════╝"
echo ""

cd "$(dirname "$0")"
BACKEND_DIR="$(pwd)/backend"
FRONTEND_DIR="$(pwd)/frontend"

# --- START BACKEND ---
echo "🔧 Starting Backend API (port 8000)..."
cd "$BACKEND_DIR"

# Use venv uvicorn if available, otherwise standalone server
if [ -f "./venv/bin/uvicorn" ]; then
  echo "   Using FastAPI + Uvicorn..."
  ./venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000 &
else
  echo "   Using standalone Python server (no dependencies needed)..."
  python3 standalone_server.py &
fi

BACKEND_PID=$!
echo "   Backend PID: $BACKEND_PID"
sleep 2

# Verify backend is running
if curl -s http://localhost:8000/api/health > /dev/null 2>&1; then
  echo "   ✅ Backend is running at http://localhost:8000"
else
  echo "   ⚠️  Backend may still be starting..."
fi

echo ""

# --- START FRONTEND ---
echo "🎨 Starting Frontend Dev Server (port 5173)..."
cd "$FRONTEND_DIR"
npm run dev &
FRONTEND_PID=$!

echo "   Frontend PID: $FRONTEND_PID"
echo ""
echo "══════════════════════════════════════════"
echo "✅ CampusForge is starting!"
echo "   Frontend: http://localhost:5173"
echo "   Backend:  http://localhost:8000"
echo "   API Docs: http://localhost:8000/docs"
echo "══════════════════════════════════════════"
echo ""
echo "Press CTRL+C to stop both servers."

# Wait and cleanup on exit
trap "echo ''; echo 'Stopping servers...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM
wait
