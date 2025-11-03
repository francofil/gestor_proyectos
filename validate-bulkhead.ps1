# Script de Validación Rápida del Patrón Bulkhead
# Verifica que todo esté correctamente configurado

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "BULKHEAD VALIDATION" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$errors = 0

# 1. Verificar que existe config.json
Write-Host "Checking config.json..." -ForegroundColor Yellow
if (Test-Path "config.json") {
    Write-Host "   config.json exists" -ForegroundColor Green
    
    # Verificar que tiene la sección bulkhead
    $config = Get-Content "config.json" | ConvertFrom-Json
    if ($config.bulkhead) {
        Write-Host "   Bulkhead configuration present" -ForegroundColor Green
    } else {
        Write-Host "   ERROR: Missing 'bulkhead' section in config.json" -ForegroundColor Red
        $errors++
    }
} else {
    Write-Host "   ERROR: config.json does not exist" -ForegroundColor Red
    $errors++
}

Write-Host ""

# 2. Verificar archivos de Bulkhead
Write-Host "Checking implementation files..." -ForegroundColor Yellow

$requiredFiles = @(
    "src/config/bulkheadPools.ts",
    "src/middleware/bulkhead.ts",
    "tests/stress-test-tasks.js",
    "tests/monitor-projects.js",
    "tests/run-bulkhead-test.ps1",
    "BULKHEAD.md"
)

foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "   $file" -ForegroundColor Green
    } else {
        Write-Host "   $file DOES NOT EXIST" -ForegroundColor Red
        $errors++
    }
}

Write-Host ""

# 3. Verificar que la API esté corriendo
Write-Host "Checking API..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/health" -Method GET -TimeoutSec 5 -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Host "   API running on http://localhost:3000" -ForegroundColor Green
        
        # Verificar endpoint de métricas
        try {
            $metricsResponse = Invoke-WebRequest -Uri "http://localhost:3000/bulkhead/metrics" -Method GET -TimeoutSec 5
            Write-Host "   Endpoint /bulkhead/metrics available" -ForegroundColor Green
        } catch {
            Write-Host "   Endpoint /bulkhead/metrics not responding" -ForegroundColor Yellow
        }
    }
} catch {
    Write-Host "   API is not running (normal if not started yet)" -ForegroundColor Yellow
    Write-Host "      To start: npm run dev or docker-compose up" -ForegroundColor Gray
}

Write-Host ""

# 4. Verificar Node.js
Write-Host "Checking Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "   Node.js $nodeVersion installed" -ForegroundColor Green
} catch {
    Write-Host "   ERROR: Node.js is not installed" -ForegroundColor Red
    $errors++
}

Write-Host ""

# Resumen
Write-Host "========================================" -ForegroundColor Cyan
if ($errors -eq 0) {
    Write-Host "VALIDATION SUCCESSFUL" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Everything is correctly configured. You can:" -ForegroundColor Green
    Write-Host "  1. Start API: npm run dev" -ForegroundColor White
    Write-Host "  2. Run tests: .\tests\run-bulkhead-test.ps1" -ForegroundColor White
    Write-Host "  3. View metrics: curl http://localhost:3000/bulkhead/metrics" -ForegroundColor White
} else {
    Write-Host "VALIDATION FAILED ($errors errors)" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Please review the errors above." -ForegroundColor Yellow
}
Write-Host ""
