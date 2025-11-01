import { sequelizeReplica } from '../config/db';

/**
 * QUERIES - Operaciones de LECTURA (usa sequelizeReplica)
 */

export const getAllUsers = async () => {
  const [results] = await sequelizeReplica.query(
    'SELECT * FROM users ORDER BY id',
    { raw: true }
  );
  return results;
};

export const getUserById = async (id: string) => {
  const [results]: any = await sequelizeReplica.query(
    'SELECT * FROM users WHERE id = :id',
    { 
      replacements: { id },
      raw: true
    }
  );
  return results[0];
};
