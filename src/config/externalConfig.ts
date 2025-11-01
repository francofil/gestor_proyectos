import fs from 'fs';
import path from 'path';

const CONFIG_FILE = path.join(__dirname, '../../config.json');

export interface Config {
  database: {
    master: {
      host: string;
      port: number;
      database: string;
      user: string;
      password: string;
    };
    replica: {
      host: string;
      port: number;
      database: string;
      user: string;
      password: string;
    };
  };
  server: {
    port: number;
    environment: string;
  };
  retry: {
    maxRetries: number;
    initialDelay: number;
    backoffMultiplier: number;
  };
  features: {
    enableLogging: boolean;
    enableCache: boolean;
  };
}

/**
 * Lee la configuración del archivo JSON
 * Se ejecuta cada vez que se necesita para permitir cambios en caliente
 */
export const getConfig = (): Config => {
  try {
    const configData = fs.readFileSync(CONFIG_FILE, 'utf-8');
    return JSON.parse(configData);
  } catch (error: any) {
    console.error('Error leyendo config.json:', error.message);
    throw new Error('No se pudo cargar la configuración');
  }
};
