import { Request, Response } from 'express';
import { getAllUsers, getUserById, getUserTasks as getUserTasksQuery } from '../queries/userQueries';
import { createUser, updateUser, deleteUser } from '../commands/userCommands';

export class UserController {
  // QUERY - Obtener todos los usuarios (usa replica)
  static async getUsers(req: Request, res: Response): Promise<void> {
    try {
      const users = await getAllUsers();
      res.json(users);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  // QUERY - Obtener un usuario por ID (usa replica)
  static async getUserById(req: Request, res: Response): Promise<void> {
    try {
      const user = await getUserById(req.params.id);
      if (!user) {
        res.status(404).json({ error: 'Usuario no encontrado' });
        return;
      }
      res.json(user);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  // COMMAND - Crear usuario (usa master)
  static async createUser(req: Request, res: Response): Promise<void> {
    try {
      const { name, email } = req.body;
      const user = await createUser(name, email);
      res.status(201).json(user);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  // COMMAND - Actualizar usuario (usa master)
  static async updateUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const user = await updateUser(id, req.body);
      if (!user) {
        res.status(404).json({ error: 'Usuario no encontrado' });
        return;
      }
      res.json(user);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  // COMMAND - Eliminar usuario (usa master)
  static async deleteUser(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const deleted = await deleteUser(id);
      if (!deleted) {
        res.status(404).json({ error: 'Usuario no encontrado' });
        return;
      }
      res.status(204).send();
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  // QUERY - Obtener todas las tareas de un usuario (usa replica)
  static async getUserTasks(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = await getUserTasksQuery(id);
      
      if (!result) {
        res.status(404).json({ error: 'Usuario no encontrado' });
        return;
      }

      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
}
