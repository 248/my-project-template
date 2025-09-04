# PowerShell script to stop all development processes
# Usage: ./scripts/stop-all.ps1

Write-Host "🛑 Stopping all development processes..." -ForegroundColor Yellow

# Function to stop processes by port
function Stop-ProcessByPort {
    param([int]$Port)
    
    try {
        $processes = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess
        if ($processes) {
            foreach ($pid in $processes) {
                $process = Get-Process -Id $pid -ErrorAction SilentlyContinue
                if ($process) {
                    Write-Host "  Stopping process on port $Port (PID: $pid, Name: $($process.ProcessName))" -ForegroundColor Red
                    Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
                }
            }
        }
    }
    catch {
        Write-Host "  No process found on port $Port" -ForegroundColor Gray
    }
}

# Function to stop processes by name pattern
function Stop-ProcessByName {
    param([string]$Pattern)
    
    try {
        # より具体的な条件で開発プロセスのみを対象にする
        $processes = Get-Process | Where-Object { 
            ($_.ProcessName -like "*$Pattern*" -and ($_.CommandLine -like "*dev*" -or $_.CommandLine -like "*watch*")) -or
            ($_.MainWindowTitle -like "*$Pattern*" -and $_.MainWindowTitle -like "*dev*")
        }
        foreach ($process in $processes) {
            Write-Host "  Stopping $Pattern process (PID: $($process.Id), Name: $($process.ProcessName))" -ForegroundColor Red
            Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
        }
    }
    catch {
        Write-Host "  No $Pattern processes found" -ForegroundColor Gray
    }
}

# Stop development servers by ports
Write-Host "📡 Stopping servers by ports..."
Stop-ProcessByPort 3000  # Frontend (Vite)
Stop-ProcessByPort 3005  # Frontend alternative
Stop-ProcessByPort 8000  # Backend (Hono)
Stop-ProcessByPort 5432  # PostgreSQL
Stop-ProcessByPort 6379  # Redis

# Stop Node.js development processes
Write-Host "⚡ Stopping Node.js development processes..."
Stop-ProcessByName "tsx"
Stop-ProcessByName "vite"
Stop-ProcessByName "next"

# Stop Docker containers and compose services
Write-Host "🐳 Stopping Docker services..."
try {
    # Docker Compose services停止
    if (Test-Path "infra\docker\docker-compose.yml") {
        Write-Host "  Stopping Docker Compose services..." -ForegroundColor Yellow
        Push-Location "infra\docker"
        docker compose down 2>$null | Out-Null
        Pop-Location
        Write-Host "  Docker Compose services stopped" -ForegroundColor Green
    }
    
    # 残りのプロジェクトコンテナを停止
    $containers = docker ps -q --filter "name=docker-" 2>$null
    if ($containers) {
        Write-Host "  Stopping remaining project containers..." -ForegroundColor Yellow
        docker stop $containers 2>$null | Out-Null
        Write-Host "  Remaining containers stopped" -ForegroundColor Green
    }
}
catch {
    Write-Host "  Docker not available or no containers running" -ForegroundColor Gray
}

Write-Host "✅ All processes stopped successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "💡 To restart development:" -ForegroundColor Cyan
Write-Host "  • Frontend + Backend: pnpm dev" -ForegroundColor White
Write-Host "  • Docker services: pnpm dev:docker" -ForegroundColor White
Write-Host "  • Backend only: cd apps/backend && pnpm dev" -ForegroundColor White