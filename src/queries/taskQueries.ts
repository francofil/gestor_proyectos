import { tasksMasterPool, tasksReplicaPool } from '../config/bulkheadPools';
import { retryQuery } from '../utils/retryQuery';

export const getAllTasks = async () => {
  // Usar master temporalmente porque la réplica no está disponible
  const [results] = await retryQuery(
    tasksMasterPool,
    'SELECT * FROM tasks ORDER BY id',
    { raw: true }
  );
  return results;
};

export const getTaskById = async (id: string) => {
  // Usar master temporalmente porque la réplica no está disponible
  const [results]: any = await retryQuery(
    tasksMasterPool,
    'SELECT * FROM tasks WHERE id = :id',
    { 
      replacements: { id },
      raw: true
    }
  );
  return results[0];
};
