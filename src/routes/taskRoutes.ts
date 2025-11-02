import { Router } from 'express';
import { TaskController } from '../controllers/TaskController';
import { bulkheadMiddleware } from '../middleware/bulkhead';

const router = Router();

// Aplicar middleware de Bulkhead para limitar concurrencia en módulo de tareas
router.use(bulkheadMiddleware('tasks'));

router.get('/', TaskController.getAll);
router.get('/:id', TaskController.getById);
router.post('/', TaskController.create);
router.put('/:id', TaskController.update);
router.delete('/:id', TaskController.delete);

export default router;
