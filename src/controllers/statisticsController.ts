import { Request, Response } from 'express';
import { getProjectStatistics, getProjectStatisticsById, refreshProjectStatistics } from '../queries/statisticsQueries';

export class StatisticsController {
  // QUERY - Obtener todas las estadísticas de proyectos (usa replica)
  static async getAllStatistics(req: Request, res: Response): Promise<void> {
    try {
      const statistics = await getProjectStatistics();
      res.json(statistics);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  // QUERY - Obtener estadísticas de un proyecto específico (usa replica)
  static async getStatisticsByProjectId(req: Request, res: Response): Promise<void> {
    try {
      const { projectId } = req.params;
      const statistics = await getProjectStatisticsById(projectId);
      
      if (!statistics) {
        res.status(404).json({ error: 'Estadísticas no encontradas para este proyecto' });
        return;
      }
      
      res.json(statistics);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  // COMMAND - Refrescar la vista materializada
  static async refreshStatistics(req: Request, res: Response): Promise<void> {
    try {
      const result = await refreshProjectStatistics();
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
}
