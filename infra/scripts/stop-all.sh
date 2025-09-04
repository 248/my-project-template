#!/bin/bash
# Bash script to stop all development processes
# Usage: ./scripts/stop-all.sh

set -e

echo "🛑 Stopping all development processes..."

# Function to stop processes by port
stop_by_port() {
    local port=$1
    local pids=$(lsof -ti :$port 2>/dev/null || true)
    
    if [[ -n "$pids" ]]; then
        echo "  Stopping processes on port $port (PIDs: $pids)"
        kill -9 $pids 2>/dev/null || true
    else
        echo "  No processes found on port $port" >&2
    fi
}

# Function to stop processes by name pattern
stop_by_name() {
    local pattern=$1
    local pids=$(pgrep -f "$pattern" 2>/dev/null || true)
    
    if [[ -n "$pids" ]]; then
        echo "  Stopping $pattern processes (PIDs: $pids)"
        kill -9 $pids 2>/dev/null || true
    else
        echo "  No $pattern processes found" >&2
    fi
}

# Stop development servers by ports
echo "📡 Stopping servers by ports..."
stop_by_port 3000  # Frontend (Vite)
stop_by_port 3005  # Frontend alternative
stop_by_port 8000  # Backend (Hono)
stop_by_port 5432  # PostgreSQL
stop_by_port 6379  # Redis

# Stop Node.js development processes
echo "⚡ Stopping Node.js development processes..."
stop_by_name "tsx.*watch"
stop_by_name "vite.*dev"
stop_by_name "pnpm.*dev"
stop_by_name "next.*dev"

# Stop Docker containers if running
echo "🐳 Stopping Docker containers..."
if command -v docker >/dev/null 2>&1; then
    containers=$(docker ps -q 2>/dev/null || true)
    if [[ -n "$containers" ]]; then
        docker stop $containers >/dev/null 2>&1 || true
        echo "  Docker containers stopped"
    else
        echo "  No running Docker containers found" >&2
    fi
else
    echo "  Docker not available" >&2
fi

echo "✅ All processes stopped successfully!"
echo ""
echo "💡 To restart development:"
echo "  • Frontend + Backend: pnpm dev"
echo "  • Docker services: pnpm dev:docker"
echo "  • Backend only: cd apps/backend && pnpm dev"