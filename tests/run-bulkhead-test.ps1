# Script de prueba del patrón Bulkhead
# Ejecuta bombardeo en /tasks mientras monitorea /projects
# 
# Uso: .\tests\run-bulkhead-test.ps1

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🔥 PRUEBA DE PATRÓN BULKHEAD" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Esta prueba validará el aislamiento de recursos entre módulos:" -ForegroundColor Yellow
Write-Host "  1. Bombardeará el endpoint /tasks con 100 requests concurrentes" -ForegroundColor Yellow
Write-Host "  2. Simultáneamente monitoreará el endpoint /projects" -ForegroundColor Yellow
Write-Host "  3. Si Bulkhead funciona: /projects mantiene latencias normales" -ForegroundColor Yellow
Write-Host "  4. Sin Bulkhead: /projects se degradaría por compartir recursos" -ForegroundColor Yellow
Write-Host ""

# Verificar que la API esté corriendo
Write-Host "🔍 Verificando que la API esté corriendo..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/health" -Method GET -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ API corriendo en http://localhost:3000" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ ERROR: La API no está corriendo en http://localhost:3000" -ForegroundColor Red
    Write-Host "   Por favor, inicia la API primero con: npm run dev" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "⏳ Esperando 3 segundos antes de comenzar..." -ForegroundColor Cyan
Start-Sleep -Seconds 3

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🚀 INICIANDO PRUEBAS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Iniciar el monitoreo de /projects en segundo plano
Write-Host "📊 Iniciando monitoreo de /projects (30 segundos)..." -ForegroundColor Magenta
$monitorJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    node tests/monitor-projects.js 30 http://localhost:3000
}

# Esperar 2 segundos para que el monitoreo se estabilice
Start-Sleep -Seconds 2

# Lanzar el bombardeo a /tasks
Write-Host "💣 Bombardeando /tasks con 100 requests concurrentes..." -ForegroundColor Red
$stressJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    node tests/stress-test-tasks.js 100 http://localhost:3000
}

Write-Host ""
Write-Host "⏳ Esperando a que terminen las pruebas..." -ForegroundColor Cyan
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
Write-Host "🎯 VERIFICACIÓN DE MÉTRICAS BULKHEAD" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Obtener métricas de Bulkhead
try {
    $metricsResponse = Invoke-WebRequest -Uri "http://localhost:3000/bulkhead/metrics" -Method GET
    $metrics = $metricsResponse.Content | ConvertFrom-Json
    
    Write-Host "📊 Estado de los módulos Bulkhead:" -ForegroundColor Green
    Write-Host ""
    
    foreach ($module in $metrics.bulkhead.modules.PSObject.Properties) {
        $name = $module.Name
        $data = $module.Value
        
        Write-Host "  [$name]" -ForegroundColor Cyan
        Write-Host "    Concurrencia actual: $($data.current)/$($data.limit)" -ForegroundColor White
        Write-Host "    Utilización: $($data.utilizationPercent)%" -ForegroundColor White
        Write-Host "    Requests aceptadas: $($data.accepted)" -ForegroundColor Green
        Write-Host "    Requests rechazadas: $($data.rejected)" -ForegroundColor Red
        Write-Host ""
    }
} catch {
    Write-Host "⚠️  No se pudieron obtener las métricas de Bulkhead" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ PRUEBA COMPLETADA" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📝 Analiza los resultados anteriores:" -ForegroundColor Yellow
Write-Host "   - Si /projects mantuvo P95/P99 bajos → Bulkhead funcionó ✅" -ForegroundColor Yellow
Write-Host "   - Si /tasks tuvo requests rechazadas (503) → Límite de concurrencia activo ✅" -ForegroundColor Yellow
Write-Host "   - Si ambos módulos mantienen su independencia → Aislamiento exitoso ✅" -ForegroundColor Yellow
Write-Host ""
