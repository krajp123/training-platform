import { Router } from 'express';
import {
  createLiveClass, deleteLiveClass, listLiveClasses,
} from './controller.js';
import { requireAdmin } from '../admin-auth/controller.js';

const router = Router();

router.get('/', listLiveClasses);
router.post('/', requireAdmin, createLiveClass);
router.delete('/:id', requireAdmin, deleteLiveClass);

export default router;
