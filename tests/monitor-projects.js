/**
 * Script de monitoreo del endpoint /projects mientras /tasks está bajo estrés
 * 
 * Este script mide las latencias del endpoint de proyectos mientras otro proceso
 * bombardea el endpoint de tareas. Sirve para verificar el aislamiento del Bulkhead.
 * 
 * Uso:
 *   node tests/monitor-projects.js [DURATION_SECONDS] [API_URL]
 * 
 * Ejemplo:
 *   node tests/monitor-projects.js 30 http://localhost:3000
 */

const http = require('http');
const https = require('https');

// Configuración
const API_URL = process.argv[3] || 'http://localhost:3000';
const DURATION_SECONDS = parseInt(process.argv[2]) || 30;
const ENDPOINT = '/projects';
const REQUEST_INTERVAL = 500; // ms entre requests

// Métricas
let completed = 0;
let errors = 0;
let success = 0;
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
          console.log(`✅ Request ${id} a /projects: ${responseTime}ms`);
        } else {
          errors++;
          console.log(`❌ Request ${id} a /projects: ERROR ${res.statusCode} (${responseTime}ms)`);
        }
        
        resolve();
      });
    });
    
    req.on('error', (err) => {
      const responseTime = Date.now() - requestStart;
      responseTimes.push(responseTime);
      completed++;
      errors++;
      console.log(`❌ Request ${id} a /projects: NETWORK ERROR - ${err.message}`);
      resolve();
    });
    
    req.setTimeout(30000, () => {
      req.destroy();
      completed++;
      errors++;
      console.log(`⏱️  Request ${id} a /projects: TIMEOUT`);
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
 * Ejecuta el monitoreo continuo
 */
async function runMonitoring() {
  console.log('\n========================================');
  console.log('📊 MONITOREO - Endpoint /projects');
  console.log('========================================');
  console.log(`API URL: ${API_URL}`);
  console.log(`Endpoint: ${ENDPOINT}`);
  console.log(`Duración: ${DURATION_SECONDS} segundos`);
  console.log(`Intervalo: ${REQUEST_INTERVAL}ms entre requests`);
  console.log('========================================\n');
  
  let requestId = 1;
  const endTime = startTime + (DURATION_SECONDS * 1000);
  
  // Enviar requests periódicamente
  while (Date.now() < endTime) {
    makeRequest(requestId++);
    await new Promise(resolve => setTimeout(resolve, REQUEST_INTERVAL));
  }
  
  // Esperar a que terminen las últimas requests
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  const totalTime = Date.now() - startTime;
  
  // Calcular estadísticas
  if (responseTimes.length === 0) {
    console.log('❌ No se obtuvieron métricas');
    return;
  }
  
  const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
  const p50 = calculatePercentile(responseTimes, 50);
  const p95 = calculatePercentile(responseTimes, 95);
  const p99 = calculatePercentile(responseTimes, 99);
  const maxResponseTime = Math.max(...responseTimes);
  const minResponseTime = Math.min(...responseTimes);
  
  // Mostrar resultados
  console.log('\n========================================');
  console.log('📊 RESULTADOS DEL MONITOREO');
  console.log('========================================');
  console.log(`Total de requests: ${completed}`);
  console.log(`Exitosas (200): ${success} (${((success/completed)*100).toFixed(2)}%)`);
  console.log(`Errores: ${errors} (${((errors/completed)*100).toFixed(2)}%)`);
  console.log(`Tiempo total: ${totalTime}ms`);
  console.log(`Throughput: ${(completed / (totalTime / 1000)).toFixed(2)} req/s`);
  console.log('');
  console.log('📈 LATENCIAS DE /projects:');
  console.log(`  Mínima: ${minResponseTime}ms`);
  console.log(`  Promedio: ${avgResponseTime.toFixed(2)}ms`);
  console.log(`  P50 (mediana): ${p50}ms`);
  console.log(`  P95: ${p95}ms`);
  console.log(`  P99: ${p99}ms`);
  console.log(`  Máxima: ${maxResponseTime}ms`);
  console.log('========================================\n');
  
  // Interpretación para Bulkhead
  if (p99 < 1000 && errors === 0) {
    console.log('✅ EXCELENTE: /projects mantiene latencias bajas y sin errores');
    console.log('   El patrón Bulkhead está protegiendo este endpoint del estrés en /tasks');
  } else if (p99 < 3000) {
    console.log('⚠️  ACEPTABLE: /projects muestra algo de degradación pero sigue operativo');
  } else {
    console.log('❌ DEGRADADO: /projects muestra alta latencia o errores');
    console.log('   El aislamiento de Bulkhead puede no estar funcionando correctamente');
  }
}

// Ejecutar
runMonitoring().catch(console.error);
