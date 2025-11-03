import { usersReplicaPool } from '../config/bulkheadPools';
import { retryQuery } from '../utils/retryQuery';

export const getAllUsers = async () => {
  const [results] = await retryQuery(
    usersReplicaPool,
    'SELECT * FROM users ORDER BY id',
    { raw: true }
  );
  return results;
};

export const getUserById = async (id: string) => {
  const [results]: any = await retryQuery(
    usersReplicaPool,
    'SELECT * FROM users WHERE id = :id',
    { 
      replacements: { id },
      raw: true
    }
  );
  return results[0];
};
