import { Router } from 'express';
import { currentAdmin, login, logout, requireAdmin } from './controller.js';

const router = Router();

router.post('/login', login);
router.get('/me', currentAdmin);
router.post('/logout', requireAdmin, logout);

export default router;
