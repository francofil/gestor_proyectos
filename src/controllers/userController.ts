import { Request, Response } from 'express';
import User from '../models/user';
import Task from '../models/task';

export class UserController {
  // Obtener todos los usuarios
  static async getUsers(req: Request, res: Response): Promise<void> {
    try {
      const users = await User.findAll();
      res.json(users);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  // Crear usuario
  static async createUser(req: Request, res: Response): Promise<void> {
    try {
      const { name, email } = req.body;
      const user = await User.create({ name, email });
      res.status(201).json(user);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  // Obtener todas las tareas de un usuario específico
  static async getUserTasks(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      // Verificar que el usuario existe
      const user = await User.findByPk(id);
      if (!user) {
        res.status(404).json({ error: 'Usuario no encontrado' });
        return;
      }

      // Obtener todas las tareas del usuario
      const tasks = await Task.findAll({
        where: { userId: id }
      });

      res.json({
        user: {
          id: user.id,
          name: user.name,
          email: user.email
        },
        tasks: tasks
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
}
