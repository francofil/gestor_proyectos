import { Router } from 'express';
import { StatisticsController } from '../controllers/statisticsController';

const router = Router();

/**
 * @route   GET /statistics
 * @desc    Obtener estadísticas de todos los proyectos (usa REPLICA - lectura)
 */
router.get('/', StatisticsController.getAllStatistics);

/**
 * @route   GET /statistics/:projectId
 * @desc    Obtener estadísticas de un proyecto específico (usa REPLICA - lectura)
 */
router.get('/:projectId', StatisticsController.getStatisticsByProjectId);

/**
 * @route   POST /statistics/refresh
 * @desc    Refrescar la vista materializada
 */
router.post('/refresh', StatisticsController.refreshStatistics);

export default router;
