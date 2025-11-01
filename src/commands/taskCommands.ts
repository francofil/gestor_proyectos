import { sequelizeMaster } from '../config/db';

/**
 * COMMANDS - Operaciones de ESCRITURA (usa sequelizeMaster)
 */

export const createTask = async (title: string, userId: number, projectId: number) => {
  const [result]: any = await sequelizeMaster.query(
    'INSERT INTO tasks (title, user_id, project_id, completed, created_at, updated_at) VALUES (:title, :userId, :projectId, false, NOW(), NOW()) RETURNING *',
    {
      replacements: { title, userId, projectId }
    }
  );
  return result[0];
};

export const updateTask = async (id: string, data: { title?: string; userId?: number; projectId?: number }) => {
  const fields = [];
  const replacements: any = { id };
  
  if (data.title) {
    fields.push('title = :title');
    replacements.title = data.title;
  }
  if (data.userId) {
    fields.push('user_id = :userId');
    replacements.userId = data.userId;
  }
  if (data.projectId) {
    fields.push('project_id = :projectId');
    replacements.projectId = data.projectId;
  }
  
  if (fields.length === 0) return null;
  
  fields.push('updated_at = NOW()');
  
  const [result]: any = await sequelizeMaster.query(
    `UPDATE tasks SET ${fields.join(', ')} WHERE id = :id RETURNING *`,
    {
      replacements
    }
  );
  
  return result && result[0] ? result[0] : null;
};

export const deleteTask = async (id: string) => {
  await sequelizeMaster.query(
    'DELETE FROM tasks WHERE id = :id',
    {
      replacements: { id }
    }
  );
  return true;
};
