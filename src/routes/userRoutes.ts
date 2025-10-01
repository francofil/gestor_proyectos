import { Router } from 'express';
import { UserController } from '../controllers/userController';

const router = Router();

router.get('/', UserController.getUsers);   // GET /users
router.post('/', UserController.createUser); // POST /users
router.get('/:id/tasks', UserController.getUserTasks); // GET /users/:id/tasks

export default router;
