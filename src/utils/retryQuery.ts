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
      return result as T;
    } catch (error: any) {
      lastError = error;
    
      
      if (attempt > MAX_RETRIES) {
        throw error;
      }
      
      const delay = calculateDelay(attempt);
      await sleep(delay);
    }
  }
  
  throw lastError;
};
