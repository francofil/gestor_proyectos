#!/bin/bash

# Script de prueba del patrón Bulkhead
# Ejecuta bombardeo en /tasks mientras monitorea /projects
# 
# Uso: ./tests/run-bulkhead-test.sh

echo ""
echo "========================================"
echo "🔥 PRUEBA DE PATRÓN BULKHEAD"
echo "========================================"
echo ""
echo "Esta prueba validará el aislamiento de recursos entre módulos:"
echo "  1. Bombardeará el endpoint /tasks con 100 requests concurrentes"
echo "  2. Simultáneamente monitoreará el endpoint /projects"
echo "  3. Si Bulkhead funciona: /projects mantiene latencias normales"
echo "  4. Sin Bulkhead: /projects se degradaría por compartir recursos"
echo ""

# Verificar que la API esté corriendo
echo "🔍 Verificando que la API esté corriendo..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/health | grep -q "200"; then
    echo "✅ API corriendo en http://localhost:3000"
else
    echo "❌ ERROR: La API no está corriendo en http://localhost:3000"
    echo "   Por favor, inicia la API primero con: npm run dev"
    exit 1
fi

echo ""
echo "⏳ Esperando 3 segundos antes de comenzar..."
sleep 3

echo ""
echo "========================================"
echo "🚀 INICIANDO PRUEBAS"
echo "========================================"
echo ""

# Iniciar el monitoreo de /projects en segundo plano
echo "📊 Iniciando monitoreo de /projects (30 segundos)..."
node tests/monitor-projects.js 30 http://localhost:3000 > /tmp/bulkhead-monitor.log 2>&1 &
MONITOR_PID=$!

# Esperar 2 segundos para que el monitoreo se estabilice
sleep 2

# Lanzar el bombardeo a /tasks
echo "💣 Bombardeando /tasks con 100 requests concurrentes..."
node tests/stress-test-tasks.js 100 http://localhost:3000 > /tmp/bulkhead-stress.log 2>&1 &
STRESS_PID=$!

echo ""
echo "⏳ Esperando a que terminen las pruebas..."
echo ""

# Esperar a que termine el bombardeo
wait $STRESS_PID
cat /tmp/bulkhead-stress.log

# Esperar a que termine el monitoreo
wait $MONITOR_PID
cat /tmp/bulkhead-monitor.log

echo ""
echo "========================================"
echo "🎯 VERIFICACIÓN DE MÉTRICAS BULKHEAD"
echo "========================================"
echo ""

# Obtener métricas de Bulkhead
echo "📊 Estado de los módulos Bulkhead:"
echo ""
curl -s http://localhost:3000/bulkhead/metrics | node -e "
const data = JSON.parse(require('fs').readFileSync('/dev/stdin', 'utf8'));
const modules = data.bulkhead.modules;

Object.keys(modules).forEach(name => {
  const mod = modules[name];
  console.log(\`  [\${name}]\`);
  console.log(\`    Concurrencia actual: \${mod.current}/\${mod.limit}\`);
  console.log(\`    Utilización: \${mod.utilizationPercent}%\`);
  console.log(\`    Requests aceptadas: \${mod.accepted}\`);
  console.log(\`    Requests rechazadas: \${mod.rejected}\`);
  console.log('');
});
"

echo ""
echo "========================================"
echo "✅ PRUEBA COMPLETADA"
echo "========================================"
echo ""
echo "📝 Analiza los resultados anteriores:"
echo "   - Si /projects mantuvo P95/P99 bajos → Bulkhead funcionó ✅"
echo "   - Si /tasks tuvo requests rechazadas (503) → Límite de concurrencia activo ✅"
echo "   - Si ambos módulos mantienen su independencia → Aislamiento exitoso ✅"
echo ""

# Limpiar archivos temporales
rm -f /tmp/bulkhead-monitor.log /tmp/bulkhead-stress.log
