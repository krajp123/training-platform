import { Router } from 'express';
import {
  addAdmin, currentAdmin, editAdmin, listAdmins, login, logout, requestEmailChange, requestPasswordReset,
  requireAdmin, requireAdminRoles, resetPassword, verifyEmailChange,
} from './controller.js';

const router = Router();

router.post('/login', login);
router.post('/password-reset', resetPassword);
router.get('/me', currentAdmin);
router.post('/logout', requireAdmin, logout);
router.post('/account/email/request', requireAdmin, requestEmailChange);
router.post('/account/email/verify', requireAdmin, verifyEmailChange);
router.post('/account/password-reset', requireAdmin, requestPasswordReset);
router.get('/users', requireAdminRoles('owner'), listAdmins);
router.post('/users', requireAdminRoles('owner'), addAdmin);
router.patch('/users/:id', requireAdminRoles('owner'), editAdmin);

export default router;
