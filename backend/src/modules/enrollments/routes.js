import { Router } from 'express';
import { createEnrollment } from './controller.js';

const router = Router();

router.post('/', createEnrollment);

export default router;
