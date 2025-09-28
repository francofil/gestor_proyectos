import { Request, Response } from 'express';
import Task from '../models/task';

export class TaskController {
  static async getAll(req: Request, res: Response): Promise<void> {
    try {
      const tasks = await Task.findAll();
      res.json(tasks);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  static async getById(req: Request, res: Response): Promise<void> {
    try {
      const task = await Task.findByPk(req.params.id);
      if (!task) {
        res.status(404).json({ error: 'Tarea no encontrada' });
        return;
      }
      res.json(task);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  static async create(req: Request, res: Response): Promise<void> {
    try {
      const { title, userId, projectId } = req.body;
      const task = await Task.create({ title, userId, projectId });
      res.status(201).json(task);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  static async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const [updated] = await Task.update(req.body, { where: { id } });

      if (!updated) {
        res.status(404).json({ error: 'Tarea no encontrada' });
        return;
      }
      const updatedTask = await Task.findByPk(id);
      res.json(updatedTask);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  static async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const deleted = await Task.destroy({ where: { id } });

      if (!deleted) {
        res.status(404).json({ error: 'Tarea no encontrada' });
        return;
      }
      res.status(204).send();
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
}
