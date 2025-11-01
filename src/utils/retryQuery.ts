import { Sequelize } from 'sequelize';

// Configuración fija del patrón Retry
const MAX_RETRIES = 3;
const INITIAL_DELAY = 1000; // 1 segundo
const BACKOFF_MULTIPLIER = 2;

const calculateDelay = (attempt: number): number => {
  return INITIAL_DELAY * Math.pow(BACKOFF_MULTIPLIER, attempt - 1);
};

const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Ejecuta una query de Sequelize con reintentos automáticos
 */
export const retryQuery = async <T = any>(
  sequelizeInstance: Sequelize,
  query: string,
  options: any = {}
): Promise<T> => {
  let lastError: any;
  
  for (let attempt = 1; attempt <= MAX_RETRIES + 1; attempt++) {
    try {
      const result = await sequelizeInstance.query(query, options);
      if (attempt > 1) {
        console.log(`✅ Query exitosa después de ${attempt - 1} reintento(s)`);
      }
      return result as T;
    } catch (error: any) {
      lastError = error;
    
      
      if (attempt > MAX_RETRIES) {
        console.error(`❌ Máximo de reintentos alcanzado`);
        throw error;
      }
      
      const delay = calculateDelay(attempt);
      console.warn(`⚠️ Intento ${attempt}/${MAX_RETRIES} falló: ${error.message}. Reintentando en ${delay}ms...`);
      await sleep(delay);
    }
  }
  
  throw lastError;
};
