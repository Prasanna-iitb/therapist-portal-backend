# Start Redis Docker Container
Write-Host "Starting Redis..." -ForegroundColor Cyan

# Check if Docker is running
$dockerRunning = docker ps 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Docker is not running. Starting Docker Desktop..." -ForegroundColor Yellow
    Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    Write-Host "Waiting for Docker to start..." -ForegroundColor Yellow
    Start-Sleep -Seconds 15
}

# Start Redis container
docker start redis

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Redis started successfully!" -ForegroundColor Green
    docker ps | Select-String redis
} else {
    Write-Host "❌ Failed to start Redis" -ForegroundColor Red
}
