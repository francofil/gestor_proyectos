import { sequelizeReplica } from '../config/db';
import { retryQuery } from '../utils/retryQuery';

/**
 * QUERIES - Operaciones de LECTURA sobre la vista materializada (usa sequelizeReplica)
 */

export const getProjectStatistics = async () => {
  const [results] = await retryQuery(
    sequelizeReplica,
    'SELECT * FROM project_statistics ORDER BY project_id',
    { raw: true }
  );
  return results;
};

export const getProjectStatisticsById = async (projectId: string) => {
  const [results]: any = await retryQuery(
    sequelizeReplica,
    'SELECT * FROM project_statistics WHERE project_id = :projectId',
    { 
      replacements: { projectId },
      raw: true
    }
  );
  return results[0];
};

export const refreshProjectStatistics = async () => {
  // Esta operación refresca la vista materializada (es una escritura, pero en el contexto de lectura)
  // En un sistema CQRS estricto, esto podría ejecutarse en el master y luego replicarse
  await retryQuery(
    sequelizeReplica,
    'REFRESH MATERIALIZED VIEW project_statistics',
    {}
  );
  return { message: 'Vista materializada refrescada correctamente' };
};
