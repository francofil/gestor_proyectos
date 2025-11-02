import { Router } from 'express';
import { UserController } from '../controllers/userController';
import { bulkheadMiddleware } from '../middleware/bulkhead';

const router = Router();

// Aplicar middleware de Bulkhead para limitar concurrencia en módulo de usuarios
router.use(bulkheadMiddleware('users'));

router.get('/', UserController.getUsers);   // GET /users
router.post('/', UserController.createUser); // POST /users

export default router;
