import { tasksReplicaPool } from '../config/bulkheadPools';
import { retryQuery } from '../utils/retryQuery';

export const getAllTasks = async () => {
  const [results] = await retryQuery(
    tasksReplicaPool,
    'SELECT * FROM tasks ORDER BY id',
    { raw: true }
  );
  return results;
};

export const getTaskById = async (id: string) => {
  const [results]: any = await retryQuery(
    tasksReplicaPool,
    'SELECT * FROM tasks WHERE id = :id',
    { 
      replacements: { id },
      raw: true
    }
  );
  return results[0];
};
