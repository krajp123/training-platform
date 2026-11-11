import { Router } from 'express';
import { createEnrollment, listMyEnrollments } from './controller.js';

const router = Router();

router.get('/my', listMyEnrollments);
router.post('/', createEnrollment);

export default router;
