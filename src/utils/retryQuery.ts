import { Sequelize } from 'sequelize';
import { getConfig } from '../config/externalConfig';

const calculateDelay = (attempt: number): number => {
  const config = getConfig();
  return config.retry.initialDelay * Math.pow(config.retry.backoffMultiplier, attempt - 1);
};

const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};


export const retryQuery = async <T = any>(
  sequelizeInstance: Sequelize,
  query: string,
  options: any = {}
): Promise<T> => {
  const config = getConfig();
  const MAX_RETRIES = config.retry.maxRetries;
  let lastError: any;
  
  for (let attempt = 1; attempt <= MAX_RETRIES + 1; attempt++) {
    try {
      const result = await sequelizeInstance.query(query, options);
      if (attempt > 1 && config.features.enableLogging) {
        console.log(`Query exitosa después de ${attempt - 1} reintento(s)`);
      }
      return result as T;
    } catch (error: any) {
      lastError = error;
    
      
      if (attempt > MAX_RETRIES) {
        if (config.features.enableLogging) {
          console.error(`Máximo de reintentos alcanzado`);
        }
        throw error;
      }
      
      const delay = calculateDelay(attempt);
      if (config.features.enableLogging) {
        console.warn(`Intento ${attempt}/${MAX_RETRIES} falló: ${error.message}. Reintentando en ${delay}ms...`);
      }
      await sleep(delay);
    }
  }
  
  throw lastError;
};
