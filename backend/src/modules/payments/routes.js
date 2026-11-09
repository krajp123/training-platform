import { Router } from 'express';
import { createPaymentOrder, verifyPaymentSignature } from './controller.js';

const router = Router();

router.post('/create-order', createPaymentOrder);
router.post('/verify-signature', verifyPaymentSignature);

export default router;
