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

export const getProjectTasks = async (projectId: string) => {
  const [project]: any = await retryQuery(
    projectsReplicaPool,
    'SELECT * FROM projects WHERE id = :projectId',
    {
      replacements: { projectId },
      raw: true
    }
  );

  if (!project || project.length === 0) {
    return null;
  }

  const [tasks] = await retryQuery(
    projectsReplicaPool,
    'SELECT * FROM tasks WHERE projectId = :projectId ORDER BY id',
    {
      replacements: { projectId },
      raw: true
    }
  );

  return {
    project: project[0],
    tasks,
    totalTasks: tasks.length
  };
};

export const getProjectPendingTasks = async (projectId: string) => {
  const [project]: any = await retryQuery(
    projectsReplicaPool,
    'SELECT * FROM projects WHERE id = :projectId',
    {
      replacements: { projectId },
      raw: true
    }
  );

  if (!project || project.length === 0) {
    return null;
  }

  const [pendingTasks] = await retryQuery(
    projectsReplicaPool,
    'SELECT * FROM tasks WHERE projectId = :projectId AND completed = false ORDER BY id',
    {
      replacements: { projectId },
      raw: true
    }
  );

  const [totalTasksResult]: any = await retryQuery(
    projectsReplicaPool,
    'SELECT COUNT(*) as total FROM tasks WHERE projectId = :projectId',
    {
      replacements: { projectId },
      raw: true
    }
  );

  const totalTasks = totalTasksResult[0]?.total || 0;
  const completedTasks = totalTasks - pendingTasks.length;
  const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return {
    project: project[0],
    pendingTasks,
    summary: {
      totalTasks,
      completedTasks,
      pendingTasks: pendingTasks.length,
      progressPercentage
    }
  };
};
