# PowerShell script to cleanup lingering Node/pnpm processes
Write-Host "🧹 Cleaning up lingering Node.js processes..." -ForegroundColor Yellow

# Kill processes using port 3000 (frontend)
$port3000 = netstat -ano | Select-String ":3000" | ForEach-Object {
    $line = $_.Line.Trim()
    $parts = $line -split '\s+'
    $parts[-1]
} | Sort-Object -Unique

if ($port3000) {
    Write-Host "Found processes on port 3000: $port3000" -ForegroundColor Cyan
    foreach ($pid in $port3000) {
        if ($pid -match '^\d+$') {
            Write-Host "  Killing PID $pid..." -ForegroundColor Gray
            taskkill /PID $pid /F 2>$null
        }
    }
}

# Kill processes using port 8000 (backend)
$port8000 = netstat -ano | Select-String ":8000" | ForEach-Object {
    $line = $_.Line.Trim()
    $parts = $line -split '\s+'
    $parts[-1]
} | Sort-Object -Unique

if ($port8000) {
    Write-Host "Found processes on port 8000: $port8000" -ForegroundColor Cyan
    foreach ($pid in $port8000) {
        if ($pid -match '^\d+$') {
            Write-Host "  Killing PID $pid..." -ForegroundColor Gray
            taskkill /PID $pid /F 2>$null
        }
    }
}

# Kill any lingering tsx watch processes
Get-Process | Where-Object {$_.ProcessName -like "*tsx*" -or $_.ProcessName -like "*node*"} | Where-Object {
    $_.CommandLine -like "*tsx watch*" -or $_.CommandLine -like "*pnpm dev*"
} | ForEach-Object {
    Write-Host "Killing tsx/pnpm process: $($_.ProcessName) (PID: $($_.Id))" -ForegroundColor Yellow
    Stop-Process -Id $_.Id -Force
}

Write-Host "✅ Cleanup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Ports 3000 and 8000 should now be free." -ForegroundColor Cyan