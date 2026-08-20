# Development startup script for KANGAYATH WEB

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  Starting KANGAYATH WEB Local Dev Stack" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# Check if Docker is running
docker info > $null 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "[INFO] Starting containers via Docker Compose..." -ForegroundColor Green
    docker-compose up
} else {
    Write-Host "[WARN] Docker daemon is not active. Run services manually:" -ForegroundColor Yellow
    Write-Host "1. Backend: cd apps/api; .venv/Scripts/uvicorn app.main:app --reload --port 8000" -ForegroundColor White
    Write-Host "2. Frontend: cd apps/web; npm run dev" -ForegroundColor White
}
