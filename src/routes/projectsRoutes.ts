import { Router } from 'express';
import { ProjectController } from '../controllers/projectController';
import { bulkheadMiddleware } from '../middleware/bulkhead';

const router = Router();

// Aplicar middleware de Bulkhead para limitar concurrencia en módulo de proyectos
router.use(bulkheadMiddleware('projects'));

router.get('/', ProjectController.getAll);
router.get('/:id', ProjectController.getById);
router.post('/', ProjectController.create);
router.put('/:id', ProjectController.update);
router.delete('/:id', ProjectController.delete);

export default router;
