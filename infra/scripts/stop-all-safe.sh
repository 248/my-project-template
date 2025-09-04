#!/bin/bash
# Safe script to stop only specific development processes
# Usage: ./infra/scripts/stop-all-safe.sh

set -e

echo "🛑 Safely stopping development processes..."

# Function to stop processes by port (最も安全)
stop_by_port() {
    local port=$1
    local pids=$(lsof -ti :$port 2>/dev/null || true)
    
    if [[ -n "$pids" ]]; then
        echo "  Stopping processes on port $port (PIDs: $pids)"
        kill -TERM $pids 2>/dev/null || true
        sleep 2
        # まだ残っていれば強制終了
        local remaining_pids=$(lsof -ti :$port 2>/dev/null || true)
        if [[ -n "$remaining_pids" ]]; then
            kill -9 $remaining_pids 2>/dev/null || true
        fi
    else
        echo "  No processes found on port $port" >&2
    fi
}

# Function to stop specific development processes by working directory
stop_dev_processes() {
    echo "⚡ Stopping project-specific development processes..."
    
    # プロジェクトディレクトリ内のプロセスのみを対象
    local project_dir=$(pwd)
    
    # tsx watch プロセス（バックエンド開発サーバー）
    local tsx_pids=$(pgrep -f "tsx.*watch.*$project_dir" 2>/dev/null || true)
    if [[ -n "$tsx_pids" ]]; then
        echo "  Stopping tsx development processes: $tsx_pids"
        kill -TERM $tsx_pids 2>/dev/null || true
    fi
    
    # vite プロセス（フロントエンド開発サーバー）
    local vite_pids=$(pgrep -f "vite.*$project_dir" 2>/dev/null || true)
    if [[ -n "$vite_pids" ]]; then
        echo "  Stopping vite development processes: $vite_pids"
        kill -TERM $vite_pids 2>/dev/null || true
    fi
    
    # next dev プロセス
    local next_pids=$(pgrep -f "next.*dev.*$project_dir" 2>/dev/null || true)
    if [[ -n "$next_pids" ]]; then
        echo "  Stopping next development processes: $next_pids"
        kill -TERM $next_pids 2>/dev/null || true
    fi
}

# ポートベースでの停止（最も確実で安全）
echo "📡 Stopping servers by ports..."
stop_by_port 3000  # Frontend (Vite/Next)
stop_by_port 3005  # Frontend alternative
stop_by_port 8000  # Backend (Hono)
stop_by_port 5432  # PostgreSQL (if running locally)
stop_by_port 6379  # Redis (if running locally)

# プロジェクト固有の開発プロセス停止
stop_dev_processes

# Docker containers and compose services
echo "🐳 Stopping Docker services..."
if command -v docker >/dev/null 2>&1; then
    # Docker Compose services停止 (infra/docker配下)
    if [[ -f "$project_dir/infra/docker/docker-compose.yml" ]]; then
        echo "  Stopping Docker Compose services..."
        cd "$project_dir/infra/docker"
        docker compose down >/dev/null 2>&1 || true
        cd "$project_dir"
        echo "  Docker Compose services stopped"
    fi
    
    # プロジェクト名に基づいて残りのコンテナを停止
    project_containers=$(docker ps -q --filter "name=docker-" 2>/dev/null || true)
    if [[ -n "$project_containers" ]]; then
        echo "  Stopping remaining project containers..."
        docker stop $project_containers >/dev/null 2>&1 || true
        echo "  Remaining containers stopped"
    fi
else
    echo "  Docker not available" >&2
fi

echo "✅ Development processes stopped safely!"
echo ""
echo "💡 To restart development:"
echo "  • Frontend + Backend: pnpm dev"
echo "  • Docker services: pnpm dev:docker"
echo "  • Backend only: cd apps/backend && pnpm dev"