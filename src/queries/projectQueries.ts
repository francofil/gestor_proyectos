import { projectsMasterPool, projectsReplicaPool } from '../config/bulkheadPools';
import { retryQuery } from '../utils/retryQuery';

export const getAllProjects = async () => {
  // Usar master temporalmente porque la réplica no está disponible
  const [results] = await retryQuery(
    projectsMasterPool,
    'SELECT * FROM projects ORDER BY id',
    { raw: true }
  );
  return results;
};

export const getProjectById = async (id: string) => {
  // Usar master temporalmente porque la réplica no está disponible
  const [results]: any = await retryQuery(
    projectsMasterPool,
    'SELECT * FROM projects WHERE id = :id',
    { 
      replacements: { id },
      raw: true
    }
  );
  return results[0];
};
