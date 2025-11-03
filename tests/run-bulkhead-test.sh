#!/bin/bash

# Script de prueba del patrón Bulkhead
# Ejecuta bombardeo en /tasks mientras monitorea /projects
# 
# Uso: ./tests/run-bulkhead-test.sh

echo ""
echo "========================================"
echo "BULKHEAD PATTERN TEST"
echo "========================================"
echo ""
echo "This test validates resource isolation between modules:"
echo "  1. Bombard /tasks endpoint with 100 concurrent requests"
echo "  2. Simultaneously monitor /projects endpoint"
echo "  3. If Bulkhead works: /projects maintains normal latencies"
echo "  4. Without Bulkhead: /projects would degrade by sharing resources"
echo ""

# Verificar que la API esté corriendo
echo "Checking if API is running..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/health | grep -q "200"; then
    echo "API running on http://localhost:3000"
else
    echo "ERROR: API is not running on http://localhost:3000"
    echo "Please start the API first with: npm run dev"
    exit 1
fi

echo ""
echo "Waiting 3 seconds before starting..."
sleep 3

echo ""
echo "========================================"
echo "STARTING TESTS"
echo "========================================"
echo ""

# Iniciar el monitoreo de /projects en segundo plano
echo "Starting /projects monitoring (30 seconds)..."
node tests/monitor-projects.js 30 http://localhost:3000 > /tmp/bulkhead-monitor.log 2>&1 &
MONITOR_PID=$!

# Esperar 2 segundos para que el monitoreo se estabilice
sleep 2

# Lanzar el bombardeo a /tasks
echo "Bombarding /tasks with 100 concurrent requests..."
node tests/stress-test-tasks.js 100 http://localhost:3000 > /tmp/bulkhead-stress.log 2>&1 &
STRESS_PID=$!

echo ""
echo "Waiting for tests to complete..."
echo ""

# Esperar a que termine el bombardeo
wait $STRESS_PID
cat /tmp/bulkhead-stress.log

# Esperar a que termine el monitoreo
wait $MONITOR_PID
cat /tmp/bulkhead-monitor.log

echo ""
echo "========================================"
echo "BULKHEAD METRICS VERIFICATION"
echo "========================================"
echo ""

# Obtener métricas de Bulkhead
echo "Bulkhead module status:"
echo ""
curl -s http://localhost:3000/bulkhead/metrics | node -e "
const data = JSON.parse(require('fs').readFileSync('/dev/stdin', 'utf8'));
const modules = data.modules;

Object.keys(modules).forEach(name => {
  const mod = modules[name];
  console.log(\`  [\${name}]\`);
  console.log(\`    Current concurrency: \${mod.current}/\${mod.limit}\`);
  console.log(\`    Utilization: \${mod.utilizationPercent}%\`);
  console.log(\`    Accepted requests: \${mod.accepted}\`);
  console.log(\`    Rejected requests: \${mod.rejected}\`);
  console.log('');
});
"

echo ""
echo "========================================"
echo "TEST COMPLETED"
echo "========================================"
echo ""
echo "Analyze the results:"
echo "   - If /projects maintained low P95/P99 -> Bulkhead worked"
echo "   - If /tasks had rejected requests (503) -> Concurrency limit active"
echo "   - If both modules maintain independence -> Successful isolation"
echo ""

# Limpiar archivos temporales
rm -f /tmp/bulkhead-monitor.log /tmp/bulkhead-stress.log
