import { sequelizeReplica } from '../config/db';

/**
 * QUERIES - Operaciones de LECTURA (usa sequelizeReplica)
 */

export const getAllProjects = async () => {
  const [results] = await sequelizeReplica.query(
    'SELECT * FROM projects ORDER BY id',
    { raw: true }
  );
  return results;
};

export const getProjectById = async (id: string) => {
  const [results]: any = await sequelizeReplica.query(
    'SELECT * FROM projects WHERE id = :id',
    { 
      replacements: { id },
      raw: true
    }
  );
  return results[0];
};
