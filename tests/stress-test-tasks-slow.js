/**
 * Script de prueba de estrés para el endpoint /tasks con simulación de lentitud
 * 
 * Este script incluye un delay artificial en cada request para forzar que se acumulen
 * y el Bulkhead rechace más requests. Ideal para demos.
 * 
 * Uso:
 *   node tests/stress-test-tasks-slow.js [NUM_REQUESTS] [API_URL] [DELAY_MS]
 * 
 * Ejemplo:
 *   node tests/stress-test-tasks-slow.js 50 http://localhost:3000 500
 */

const http = require('http');
const https = require('https');

// Configuración
const API_URL = process.argv[3] || 'http://localhost:3000';
const NUM_REQUESTS = parseInt(process.argv[2]) || 50;
const DELAY_MS = parseInt(process.argv[4]) || 0; // Delay artificial para simular lentitud
const ENDPOINT = '/tasks?delay=' + DELAY_MS; // Pasamos el delay como query param

// Métricas
let completed = 0;
let errors = 0;
let success = 0;
let rejected503 = 0;
const responseTimes = [];
const startTime = Date.now();

/**
 * Realiza una request GET al endpoint especificado
 */
function makeRequest(id) {
  return new Promise((resolve) => {
    const url = new URL(API_URL + ENDPOINT);
    const client = url.protocol === 'https:' ? https : http;
    
    const requestStart = Date.now();
    
    const req = client.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const responseTime = Date.now() - requestStart;
        responseTimes.push(responseTime);
        completed++;
        
        if (res.statusCode === 200) {
          success++;
          console.log(`✅ Request ${id}: SUCCESS (${responseTime}ms)`);
        } else if (res.statusCode === 503) {
          rejected503++;
          errors++;
          console.log(`🚫 Request ${id}: REJECTED by Bulkhead - 503 Service Unavailable (${responseTime}ms)`);
        } else {
          errors++;
          console.log(`❌ Request ${id}: ERROR ${res.statusCode} (${responseTime}ms)`);
        }
        
        resolve();
      });
    });
    
    req.on('error', (err) => {
      const responseTime = Date.now() - requestStart;
      responseTimes.push(responseTime);
      completed++;
      errors++;
      console.log(`❌ Request ${id}: NETWORK ERROR - ${err.message} (${responseTime}ms)`);
      resolve();
    });
    
    req.setTimeout(30000, () => {
      req.destroy();
      const responseTime = Date.now() - requestStart;
      responseTimes.push(responseTime);
      completed++;
      errors++;
      console.log(`⏱️  Request ${id}: TIMEOUT (${responseTime}ms)`);
      resolve();
    });
  });
}

/**
 * Calcula percentiles de tiempos de respuesta
 */
function calculatePercentile(arr, percentile) {
  if (arr.length === 0) return 0;
  const sorted = arr.slice().sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[index];
}

/**
 * Ejecuta la prueba de estrés
 */
async function runStressTest() {
  console.log('\n========================================');
  console.log('🔥 PRUEBA DE ESTRÉS - Endpoint /tasks (con delay artificial)');
  console.log('========================================');
  console.log(`API URL: ${API_URL}`);
  console.log(`Endpoint: ${ENDPOINT}`);
  console.log(`Número de requests: ${NUM_REQUESTS}`);
  console.log(`Delay artificial: ${DELAY_MS}ms (para forzar acumulación)`);
  console.log(`Concurrencia: MÁXIMA (todas las requests simultáneas)`);
  console.log('========================================\n');
  
  // Disparar todas las requests al mismo tiempo
  const promises = [];
  for (let i = 1; i <= NUM_REQUESTS; i++) {
    promises.push(makeRequest(i));
  }
  
  // Esperar a que todas terminen
  await Promise.all(promises);
  
  const totalTime = Date.now() - startTime;
  
  // Calcular estadísticas
  const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
  const p50 = calculatePercentile(responseTimes, 50);
  const p95 = calculatePercentile(responseTimes, 95);
  const p99 = calculatePercentile(responseTimes, 99);
  const maxResponseTime = Math.max(...responseTimes);
  const minResponseTime = Math.min(...responseTimes);
  
  // Mostrar resultados
  console.log('\n========================================');
  console.log('📊 RESULTADOS DE LA PRUEBA');
  console.log('========================================');
  console.log(`Total de requests: ${NUM_REQUESTS}`);
  console.log(`Exitosas (200): ${success} (${((success/NUM_REQUESTS)*100).toFixed(2)}%)`);
  console.log(`Rechazadas por Bulkhead (503): ${rejected503} (${((rejected503/NUM_REQUESTS)*100).toFixed(2)}%)`);
  console.log(`Errores: ${errors} (${((errors/NUM_REQUESTS)*100).toFixed(2)}%)`);
  console.log(`Tiempo total: ${totalTime}ms`);
  console.log(`Throughput: ${(NUM_REQUESTS / (totalTime / 1000)).toFixed(2)} req/s`);
  console.log('');
  console.log('📈 LATENCIAS:');
  console.log(`  Mínima: ${minResponseTime}ms`);
  console.log(`  Promedio: ${avgResponseTime.toFixed(2)}ms`);
  console.log(`  P50 (mediana): ${p50}ms`);
  console.log(`  P95: ${p95}ms`);
  console.log(`  P99: ${p99}ms`);
  console.log(`  Máxima: ${maxResponseTime}ms`);
  console.log('========================================\n');
  
  // Interpretación para Bulkhead
  if (rejected503 > 0) {
    console.log('✅ Bulkhead funcionando: Se rechazaron requests por límite de concurrencia');
    console.log(`   Ratio de rechazo: ${((rejected503/NUM_REQUESTS)*100).toFixed(1)}%`);
  } else {
    console.log('⚠️  No se activó el Bulkhead: Todas las requests fueron procesadas');
    console.log('   Tip: Aumenta el delay artificial o el número de requests');
  }
}

// Ejecutar
runStressTest().catch(console.error);
