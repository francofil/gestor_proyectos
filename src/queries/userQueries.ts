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

export const getUserTasks = async (userId: string) => {
  const [user]: any = await retryQuery(
    usersReplicaPool,
    'SELECT * FROM users WHERE id = :userId',
    {
      replacements: { userId },
      raw: true
    }
  );

  if (!user || user.length === 0) {
    return null;
  }

  const [tasks] = await retryQuery(
    usersReplicaPool,
    'SELECT * FROM tasks WHERE userId = :userId ORDER BY id',
    {
      replacements: { userId },
      raw: true
    }
  );

  return {
    user: user[0],
    tasks
  };
};
