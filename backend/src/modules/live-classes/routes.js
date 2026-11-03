import { Router } from 'express';
import {
  createLiveClass, deleteLiveClass, listLiveClasses,
} from './controller.js';

const router = Router();

router.get('/', listLiveClasses);
router.post('/', createLiveClass);
router.delete('/:id', deleteLiveClass);

export default router;
