#!/bin/bash
# Start both API server and Next.js frontend
echo "Starting WebTruyện..."

# Start Express API on port 3001
node server/index.js &
API_PID=$!
echo "API server started (PID $API_PID) on port 3001"

# Start Next.js on port 3000
cd client && npm start &
NEXT_PID=$!
echo "Next.js started (PID $NEXT_PID) on port 3000"

echo ""
echo "  Frontend: http://localhost:3000"
echo "  Admin:    http://localhost:3000/admin"
echo "  API:      http://localhost:3001/api"
echo ""
echo "Press Ctrl+C to stop all services."

trap "kill $API_PID $NEXT_PID 2>/dev/null; exit" INT TERM
wait
