import { projectsReplicaPool } from '../config/bulkheadPools';
import { retryQuery } from '../utils/retryQuery';

export const getAllProjects = async () => {
  const [results] = await retryQuery(
    projectsReplicaPool,
    'SELECT * FROM projects ORDER BY id',
    { raw: true }
  );
  return results;
};

export const getProjectById = async (id: string) => {
  const [results]: any = await retryQuery(
    projectsReplicaPool,
    'SELECT * FROM projects WHERE id = :id',
    { 
      replacements: { id },
      raw: true
    }
  );
  return results[0];
};
