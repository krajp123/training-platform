import { Router } from 'express';
import { sendOtp, verify } from './controller.js';

const router = Router();

router.post('/request-otp', sendOtp);
router.post('/verify-otp', verify);

export default router;
