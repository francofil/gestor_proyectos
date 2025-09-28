import { Request, Response } from 'express';
import Project from '../models/project';

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
}
