# Script de Validación Rápida del Patrón Bulkhead
# Verifica que todo esté correctamente configurado

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🔍 VALIDACIÓN DE BULKHEAD" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$errors = 0

# 1. Verificar que existe config.json
Write-Host "📄 Verificando config.json..." -ForegroundColor Yellow
if (Test-Path "config.json") {
    Write-Host "   ✅ config.json existe" -ForegroundColor Green
    
    # Verificar que tiene la sección bulkhead
    $config = Get-Content "config.json" | ConvertFrom-Json
    if ($config.bulkhead) {
        Write-Host "   ✅ Configuración de bulkhead presente" -ForegroundColor Green
    } else {
        Write-Host "   ❌ ERROR: Falta sección 'bulkhead' en config.json" -ForegroundColor Red
        $errors++
    }
} else {
    Write-Host "   ❌ ERROR: config.json no existe" -ForegroundColor Red
    $errors++
}

Write-Host ""

# 2. Verificar archivos de Bulkhead
Write-Host "📁 Verificando archivos de implementación..." -ForegroundColor Yellow

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
        Write-Host "   ✅ $file" -ForegroundColor Green
    } else {
        Write-Host "   ❌ $file NO EXISTE" -ForegroundColor Red
        $errors++
    }
}

Write-Host ""

# 3. Verificar que la API esté corriendo
Write-Host "🌐 Verificando API..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/health" -Method GET -TimeoutSec 5 -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Host "   ✅ API corriendo en http://localhost:3000" -ForegroundColor Green
        
        # Verificar endpoint de métricas
        try {
            $metricsResponse = Invoke-WebRequest -Uri "http://localhost:3000/bulkhead/metrics" -Method GET -TimeoutSec 5
            Write-Host "   ✅ Endpoint /bulkhead/metrics disponible" -ForegroundColor Green
        } catch {
            Write-Host "   ⚠️  Endpoint /bulkhead/metrics no responde" -ForegroundColor Yellow
        }
    }
} catch {
    Write-Host "   ⚠️  API no está corriendo (esto es normal si aún no la iniciaste)" -ForegroundColor Yellow
    Write-Host "      Para iniciar: npm run dev o docker-compose up" -ForegroundColor Gray
}

Write-Host ""

# 4. Verificar Node.js
Write-Host "📦 Verificando Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "   ✅ Node.js $nodeVersion instalado" -ForegroundColor Green
} catch {
    Write-Host "   ❌ ERROR: Node.js no está instalado" -ForegroundColor Red
    $errors++
}

Write-Host ""

# Resumen
Write-Host "========================================" -ForegroundColor Cyan
if ($errors -eq 0) {
    Write-Host "✅ VALIDACIÓN EXITOSA" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Todo está correctamente configurado. Puedes:" -ForegroundColor Green
    Write-Host "  1. Iniciar la API: npm run dev" -ForegroundColor White
    Write-Host "  2. Ejecutar pruebas: .\tests\run-bulkhead-test.ps1" -ForegroundColor White
    Write-Host "  3. Ver métricas: curl http://localhost:3000/bulkhead/metrics" -ForegroundColor White
} else {
    Write-Host "❌ VALIDACIÓN FALLIDA ($errors errores)" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Por favor, revisa los errores anteriores." -ForegroundColor Yellow
}
Write-Host ""
