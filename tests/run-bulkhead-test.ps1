# Script de prueba del patrón Bulkhead
# Ejecuta bombardeo en /tasks mientras monitorea /projects
# 
# Uso: .\tests\run-bulkhead-test.ps1

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "BULKHEAD PATTERN TEST" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "This test validates resource isolation between modules:" -ForegroundColor Yellow
Write-Host "  1. Bombard /tasks endpoint with 100 concurrent requests" -ForegroundColor Yellow
Write-Host "  2. Simultaneously monitor /projects endpoint" -ForegroundColor Yellow
Write-Host "  3. If Bulkhead works: /projects maintains normal latencies" -ForegroundColor Yellow
Write-Host "  4. Without Bulkhead: /projects would degrade by sharing resources" -ForegroundColor Yellow
Write-Host ""

# Verificar que la API esté corriendo
Write-Host "Checking if API is running..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/health" -Method GET -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "API running on http://localhost:3000" -ForegroundColor Green
    }
} catch {
    Write-Host "ERROR: API is not running on http://localhost:3000" -ForegroundColor Red
    Write-Host "Please start the API first with: npm run dev" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "Waiting 3 seconds before starting..." -ForegroundColor Cyan
Start-Sleep -Seconds 3

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "STARTING TESTS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Iniciar el monitoreo de /projects en segundo plano
Write-Host "Starting /projects monitoring (30 seconds)..." -ForegroundColor Magenta
$monitorJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    node tests/monitor-projects.js 30 http://localhost:3000
}

# Esperar 2 segundos para que el monitoreo se estabilice
Start-Sleep -Seconds 2

# Lanzar el bombardeo a /tasks
Write-Host "Bombarding /tasks with 100 concurrent requests..." -ForegroundColor Red
$stressJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    node tests/stress-test-tasks.js 100 http://localhost:3000
}

Write-Host ""
Write-Host "Waiting for tests to complete..." -ForegroundColor Cyan
Write-Host ""

# Esperar a que termine el bombardeo
Wait-Job $stressJob | Out-Null
$stressOutput = Receive-Job $stressJob
Write-Host $stressOutput

# Esperar a que termine el monitoreo
Wait-Job $monitorJob | Out-Null
$monitorOutput = Receive-Job $monitorJob
Write-Host $monitorOutput

# Limpiar jobs
Remove-Job $stressJob -Force
Remove-Job $monitorJob -Force

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "BULKHEAD METRICS VERIFICATION" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Obtener métricas de Bulkhead
try {
    $metricsResponse = Invoke-WebRequest -Uri "http://localhost:3000/bulkhead/metrics" -Method GET
    $metrics = $metricsResponse.Content | ConvertFrom-Json
    
    Write-Host "Bulkhead module status:" -ForegroundColor Green
    Write-Host ""
    
    foreach ($module in $metrics.modules.PSObject.Properties) {
        $name = $module.Name
        $data = $module.Value
        
        Write-Host "  [$name]" -ForegroundColor Cyan
        Write-Host "    Current concurrency: $($data.current)/$($data.limit)" -ForegroundColor White
        Write-Host "    Utilization: $($data.utilizationPercent)%" -ForegroundColor White
        Write-Host "    Accepted requests: $($data.accepted)" -ForegroundColor Green
        Write-Host "    Rejected requests: $($data.rejected)" -ForegroundColor Red
        Write-Host ""
    }
} catch {
    Write-Host "Could not obtain Bulkhead metrics" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "TEST COMPLETED" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Analyze the results:" -ForegroundColor Yellow
Write-Host "   - If /projects maintained low P95/P99 -> Bulkhead worked" -ForegroundColor Yellow
Write-Host "   - If /tasks had rejected requests (503) -> Concurrency limit active" -ForegroundColor Yellow
Write-Host "   - If both modules maintain independence -> Successful isolation" -ForegroundColor Yellow
Write-Host ""
