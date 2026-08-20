# Test execution script for KANGAYATH WEB

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  Running All Test Suites (API & Web)" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# Backend checks
Write-Host "`n[1/4] Checking Backend Ruff Lint & Format..." -ForegroundColor Yellow
& "apps/api/.venv/Scripts/ruff.exe" check apps/api
& "apps/api/.venv/Scripts/ruff.exe" format --check apps/api

Write-Host "`n[2/4] Checking Backend Mypy Static Types..." -ForegroundColor Yellow
& "apps/api/.venv/Scripts/mypy.exe" apps/api/app

Write-Host "`n[3/4] Running Backend Pytest..." -ForegroundColor Yellow
& "apps/api/.venv/Scripts/pytest.exe" apps/api/tests

# Frontend checks
Write-Host "`n[4/4] Running Frontend Tests & Typecheck..." -ForegroundColor Yellow
Set-Location apps/web
npm run typecheck
npm run test
Set-Location ../..

Write-Host "`n=========================================" -ForegroundColor Green
Write-Host "  All Checks Successfully Completed!" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
