#!/bin/bash
# ⟡ Mirror Intelligence — Context Engine Launcher

set -e

cd "$(dirname "$0")"

echo "⟡ Starting Context Engine..."

# Check Python dependencies
if ! python3 -c "import fastapi" 2>/dev/null; then
    echo "Installing dependencies..."
    pip3 install fastapi uvicorn httpx feedparser pydantic
fi

# Run server
if [ "$1" = "--generate" ]; then
    echo "⟡ Running daily generation..."
    python3 server.py --generate-daily
else
    echo "⟡ Starting API server on port 8083..."
    python3 server.py
fi
