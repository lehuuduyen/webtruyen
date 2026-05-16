#!/bin/bash
# Dev mode: both servers with hot reload
echo "Starting WebTruyện (dev mode)..."

node server/index.js &
API_PID=$!
echo "API server started (PID $API_PID) on port 3001"

cd client && npm run dev &
NEXT_PID=$!
echo "Next.js dev server (PID $NEXT_PID) on port 3000"

echo ""
echo "  Frontend: http://localhost:3000"
echo "  Admin:    http://localhost:3000/admin"
echo ""

trap "kill $API_PID $NEXT_PID 2>/dev/null; exit" INT TERM
wait
