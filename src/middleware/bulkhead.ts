import { Request, Response, NextFunction } from 'express';
import { getConfig } from '../config/externalConfig';

/**
 * Patrón Bulkhead: Limita requests concurrentes por módulo para evitar saturación.
 * Rechaza con 503 cuando se excede el límite configurado.
 */

interface BulkheadSemaphore {
  current: number;
  limit: number;
  queue: Array<() => void>;
  rejected: number;
  accepted: number;
}

const semaphores = new Map<string, BulkheadSemaphore>();

const initSemaphore = (module: string, limit: number): BulkheadSemaphore => {
  return {
    current: 0,
    limit,
    queue: [],
    rejected: 0,
    accepted: 0
  };
};

const acquire = (semaphore: BulkheadSemaphore): boolean => {
  if (semaphore.current < semaphore.limit) {
    semaphore.current++;
    semaphore.accepted++;
    return true;
  }
  semaphore.rejected++;
  return false;
};

const release = (semaphore: BulkheadSemaphore): void => {
  semaphore.current--;
  
  if (semaphore.queue.length > 0) {
    const next = semaphore.queue.shift();
    if (next) {
      semaphore.current++;
      next();
    }
  }
};

export const getBulkheadStats = () => {
  const stats: Record<string, any> = {};
  
  semaphores.forEach((semaphore, module) => {
    stats[module] = {
      current: semaphore.current,
      limit: semaphore.limit,
      queueSize: semaphore.queue.length,
      accepted: semaphore.accepted,
      rejected: semaphore.rejected,
      utilizationPercent: Math.round((semaphore.current / semaphore.limit) * 100)
    };
  });
  
  return stats;
};

/**
 * Middleware de Bulkhead por módulo
 * @param module - Nombre del módulo (users, projects, tasks, statistics)
 * @param maxConcurrent - Límite opcional, se lee de config.json si no se especifica
 */
export const bulkheadMiddleware = (module: string, maxConcurrent?: number) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!semaphores.has(module)) {
      let limit = maxConcurrent;
      
      if (!limit) {
        try {
          const config = getConfig();
          limit = config.bulkhead?.concurrency?.[module as keyof typeof config.bulkhead.concurrency] || 20;
        } catch (error) {
          limit = 20;
        }
      }
      
      semaphores.set(module, initSemaphore(module, limit));
    }
    
    const semaphore = semaphores.get(module)!;
    
    if (!acquire(semaphore)) {
      return res.status(503).json({
        error: 'Service unavailable',
        module,
        currentLoad: semaphore.current,
        maxConcurrency: semaphore.limit
      });
    }
    
    const requestId = `${module}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    
    // Prevenir doble-release: ambos eventos (finish/close) pueden dispararse
    let released = false;
    
    const releaseSlot = (event: string) => {
      if (released) {
        return;
      }
      released = true;
      release(semaphore);
    };
    
    res.once('finish', () => releaseSlot('finish'));
    res.once('close', () => releaseSlot('close'));
    
    next();
  };
};

export const bulkheadMetricsMiddleware = (req: Request, res: Response) => {
  const stats = getBulkheadStats();
  
  res.json({
    modules: stats,
    timestamp: new Date().toISOString()
  });
};
