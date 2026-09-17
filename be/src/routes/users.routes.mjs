import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.mjs';
import { register, login, logout, getProfile } from '../controllers/users.controller.mjs';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/profile', authMiddleware, getProfile);

export default router;
