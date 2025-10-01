import { Request, Response } from 'express';
import Project from '../models/project';
import Task from '../models/task';

export class ProjectController {
  static async getAll(req: Request, res: Response): Promise<void> {
    try {
      const projects = await Project.findAll();
      res.json(projects);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  static async getById(req: Request, res: Response): Promise<void> {
    try {
      const project = await Project.findByPk(req.params.id);
      if (!project) {
        res.status(404).json({ error: 'Proyecto no encontrado' });
        return;
      }
      res.json(project);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  static async create(req: Request, res: Response): Promise<void> {
    try {
      const { name, description } = req.body;
      const project = await Project.create({ name, description });
      res.status(201).json(project);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  static async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const [updated] = await Project.update(req.body, { where: { id } });

      if (!updated) {
        res.status(404).json({ error: 'Proyecto no encontrado' });
        return;
      }
      const updatedProject = await Project.findByPk(id);
      res.json(updatedProject);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  static async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const deleted = await Project.destroy({ where: { id } });

      if (!deleted) {
        res.status(404).json({ error: 'Proyecto no encontrado' });
        return;
      }
      res.status(204).send();
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  // Obtener todas las tareas de un proyecto
  static async getProjectTasks(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      // Verificar que el proyecto existe
      const project = await Project.findByPk(id);
      if (!project) {
        res.status(404).json({ error: 'Proyecto no encontrado' });
        return;
      }

      // Obtener todas las tareas del proyecto
      const tasks = await Task.findAll({
        where: { projectId: id }
      });

      res.json({
        project: {
          id: project.id,
          name: project.name,
          description: project.description
        },
        tasks: tasks,
        totalTasks: tasks.length
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  // Obtener todas las tareas pendientes (no completadas) de un proyecto
  static async getProjectPendingTasks(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      // Verificar que el proyecto existe
      const project = await Project.findByPk(id);
      if (!project) {
        res.status(404).json({ error: 'Proyecto no encontrado' });
        return;
      }

      // Obtener tareas pendientes del proyecto
      const pendingTasks = await Task.findAll({
        where: { 
          projectId: id,
          completed: false 
        }
      });

      // Obtener el total de tareas para calcular progreso
      const totalTasks = await Task.count({
        where: { projectId: id }
      });

      const completedTasks = totalTasks - pendingTasks.length;
      const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      res.json({
        project: {
          id: project.id,
          name: project.name,
          description: project.description
        },
        pendingTasks: pendingTasks,
        summary: {
          totalTasks: totalTasks,
          completedTasks: completedTasks,
          pendingTasks: pendingTasks.length,
          progressPercentage: progressPercentage
        }
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
}
