import { Router } from 'express';
import { ProjectController } from '../controllers/projectController';

const router = Router();

router.get('/', ProjectController.getAll);
router.get('/:id', ProjectController.getById);
router.get('/:id/tasks', ProjectController.getProjectTasks);           // GET /projects/:id/tasks
router.get('/:id/tasks/pending', ProjectController.getProjectPendingTasks); // GET /projects/:id/tasks/pending
router.post('/', ProjectController.create);
router.put('/:id', ProjectController.update);
router.delete('/:id', ProjectController.delete);

export default router;
