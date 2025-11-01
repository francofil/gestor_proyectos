import { sequelizeReplica } from '../config/db';
import { retryQuery } from '../utils/retryQuery';

/**
 * QUERIES - Operaciones de LECTURA (usa sequelizeReplica)
 */

export const getAllUsers = async () => {
  const [results] = await retryQuery(
    sequelizeReplica,
    'SELECT * FROM users ORDER BY id',
    { raw: true }
  );
  return results;
};

export const getUserById = async (id: string) => {
  const [results]: any = await retryQuery(
    sequelizeReplica,
    'SELECT * FROM users WHERE id = :id',
    { 
      replacements: { id },
      raw: true
    }
  );
  return results[0];
};
