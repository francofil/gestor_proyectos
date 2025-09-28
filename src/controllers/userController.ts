import { Request, Response } from 'express';
import User from '../models/user';

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
}
