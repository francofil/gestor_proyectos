import { Request, Response } from 'express';
import { getAllProjects, getProjectById } from '../queries/projectQueries';
import { createProject, updateProject, deleteProject } from '../commands/projectCommands';

export class ProjectController {
  // QUERY - Obtener todos los proyectos (usa replica)
  static async getAll(req: Request, res: Response): Promise<void> {
    try {
      const projects = await getAllProjects();
      res.json(projects);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  // QUERY - Obtener un proyecto por ID (usa replica)
  static async getById(req: Request, res: Response): Promise<void> {
    try {
      const project = await getProjectById(req.params.id);
      if (!project) {
        res.status(404).json({ error: 'Proyecto no encontrado' });
        return;
      }
      res.json(project);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  // COMMAND - Crear proyecto (usa master)
  static async create(req: Request, res: Response): Promise<void> {
    try {
      const { name, description } = req.body;
      const project = await createProject(name, description);
      res.status(201).json(project);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  // COMMAND - Actualizar proyecto (usa master)
  static async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const project = await updateProject(id, req.body);
      if (!project) {
        res.status(404).json({ error: 'Proyecto no encontrado' });
        return;
      }
      res.json(project);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  // COMMAND - Eliminar proyecto (usa master)
  static async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const deleted = await deleteProject(id);
      if (!deleted) {
        res.status(404).json({ error: 'Proyecto no encontrado' });
        return;
      }
      res.status(204).send();
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
}
