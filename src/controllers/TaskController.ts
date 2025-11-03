import { Request, Response } from 'express';
import { getAllTasks, getTaskById } from '../queries/taskQueries';
import { createTask, updateTask, deleteTask } from '../commands/taskCommands';

export class TaskController {
  // QUERY - Obtener todas las tareas (usa replica)
  static async getAll(req: Request, res: Response): Promise<void> {
    try {
      // Soporte para delay artificial (para pruebas de Bulkhead)
      const delayParam = req.query.delay;
      if (delayParam) {
        const delay = parseInt(delayParam as string);
        if (!isNaN(delay) && delay > 0) {
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
      
      const tasks = await getAllTasks();
      res.json(tasks);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  // QUERY - Obtener una tarea por ID (usa replica)
  static async getById(req: Request, res: Response): Promise<void> {
    try {
      const task = await getTaskById(req.params.id);
      if (!task) {
        res.status(404).json({ error: 'Tarea no encontrada' });
        return;
      }
      res.json(task);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  // COMMAND - Crear tarea (usa master)
  static async create(req: Request, res: Response): Promise<void> {
    try {
      const { title, userId, projectId } = req.body;
      const task = await createTask(title, userId, projectId);
      res.status(201).json(task);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  // COMMAND - Actualizar tarea (usa master)
  static async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const task = await updateTask(id, req.body);
      if (!task) {
        res.status(404).json({ error: 'Tarea no encontrada' });
        return;
      }
      res.json(task);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  // COMMAND - Eliminar tarea (usa master)
  static async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const deleted = await deleteTask(id);
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
