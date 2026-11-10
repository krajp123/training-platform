import { Router } from 'express';
import {
  addAdmin, currentAdmin, editAdmin, listAdmins, login, logout, requireAdmin, requireAdminRoles,
} from './controller.js';

const router = Router();

router.post('/login', login);
router.get('/me', currentAdmin);
router.post('/logout', requireAdmin, logout);
router.get('/users', requireAdminRoles('owner'), listAdmins);
router.post('/users', requireAdminRoles('owner'), addAdmin);
router.patch('/users/:id', requireAdminRoles('owner'), editAdmin);

export default router;
