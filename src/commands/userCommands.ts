import { sequelizeMaster } from '../config/db';

/**
 * COMMANDS - Operaciones de ESCRITURA (usa sequelizeMaster)
 */

export const createUser = async (name: string, email: string) => {
  const [result]: any = await sequelizeMaster.query(
    'INSERT INTO users (name, email, created_at, updated_at) VALUES (:name, :email, NOW(), NOW()) RETURNING *',
    {
      replacements: { name, email }
    }
  );
  return result[0];
};

export const updateUser = async (id: string, data: { name?: string; email?: string }) => {
  const fields = [];
  const replacements: any = { id };
  
  if (data.name) {
    fields.push('name = :name');
    replacements.name = data.name;
  }
  if (data.email) {
    fields.push('email = :email');
    replacements.email = data.email;
  }
  
  if (fields.length === 0) return null;
  
  fields.push('updated_at = NOW()');
  
  const [result]: any = await sequelizeMaster.query(
    `UPDATE users SET ${fields.join(', ')} WHERE id = :id RETURNING *`,
    {
      replacements
    }
  );
  
  return result && result[0] ? result[0] : null;
};

export const deleteUser = async (id: string) => {
  await sequelizeMaster.query(
    'DELETE FROM users WHERE id = :id',
    {
      replacements: { id }
    }
  );
  return true;
};
