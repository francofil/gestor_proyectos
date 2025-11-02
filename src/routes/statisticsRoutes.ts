import { Router } from 'express';
import { StatisticsController } from '../controllers/statisticsController';
import { bulkheadMiddleware } from '../middleware/bulkhead';

const router = Router();

// Aplicar middleware de Bulkhead para limitar concurrencia en módulo de estadísticas
router.use(bulkheadMiddleware('statistics'));

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
