import { sequelizeMaster } from '../config/db';

/**
 * COMMANDS - Operaciones de ESCRITURA (usa sequelizeMaster)
 */

export const createProject = async (name: string, description: string) => {
  const [result]: any = await sequelizeMaster.query(
    'INSERT INTO projects (name, description, created_at, updated_at) VALUES (:name, :description, NOW(), NOW()) RETURNING *',
    {
      replacements: { name, description }
    }
  );
  return result[0];
};

export const updateProject = async (id: string, data: { name?: string; description?: string }) => {
  const fields = [];
  const replacements: any = { id };
  
  if (data.name) {
    fields.push('name = :name');
    replacements.name = data.name;
  }
  if (data.description) {
    fields.push('description = :description');
    replacements.description = data.description;
  }
  
  if (fields.length === 0) return null;
  
  fields.push('updated_at = NOW()');
  
  const [result]: any = await sequelizeMaster.query(
    `UPDATE projects SET ${fields.join(', ')} WHERE id = :id RETURNING *`,
    {
      replacements
    }
  );
  
  return result && result[0] ? result[0] : null;
};

export const deleteProject = async (id: string) => {
  await sequelizeMaster.query(
    'DELETE FROM projects WHERE id = :id',
    {
      replacements: { id }
    }
  );
  return true;
};
