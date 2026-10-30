import { Router } from 'express';
import { createEnrollment } from '../controllers/enrollmentController.js';

const router = Router();

router.post('/', createEnrollment);

export default router;
