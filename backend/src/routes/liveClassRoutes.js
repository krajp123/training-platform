import { Router } from 'express';
import {
  createLiveClass, deleteLiveClass, listLiveClasses,
} from '../controllers/liveClassController.js';

const router = Router();

router.get('/', listLiveClasses);
router.post('/', createLiveClass);
router.delete('/:id', deleteLiveClass);

export default router;
