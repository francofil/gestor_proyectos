import { Router } from 'express';
import { UserController } from '../controllers/userController';

const router = Router();

router.get('/', UserController.getUsers);   // GET /users
router.post('/', UserController.createUser); // POST /users

export default router;
