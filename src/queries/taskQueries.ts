import { sequelizeReplica } from '../config/db';
import { retryQuery } from '../utils/retryQuery';

/**
 * QUERIES - Operaciones de LECTURA (usa sequelizeReplica)
 */

export const getAllTasks = async () => {
  const [results] = await retryQuery(
    sequelizeReplica,
    'SELECT * FROM tasks ORDER BY id',
    { raw: true }
  );
  return results;
};

export const getTaskById = async (id: string) => {
  const [results]: any = await retryQuery(
    sequelizeReplica,
    'SELECT * FROM tasks WHERE id = :id',
    { 
      replacements: { id },
      raw: true
    }
  );
  return results[0];
};
