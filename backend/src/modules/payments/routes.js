import { Router } from 'express';
import { requireAdminRoles } from '../admin-auth/controller.js';
import {
  createPaymentOrder, getOrderReceipt, learnerOrders, listOrders, markPaymentFailed, refundPayment, verifyPaymentSignature,
} from './controller.js';

const router = Router();

router.post('/create-order', createPaymentOrder);
router.post('/verify-signature', verifyPaymentSignature);
router.get('/my-orders', learnerOrders);
router.get('/my-orders/:id/receipt', getOrderReceipt);
router.post('/failure', markPaymentFailed);
router.get('/orders', requireAdminRoles('owner', 'finance'), listOrders);
router.post('/orders/:id/refund', requireAdminRoles('owner', 'finance'), refundPayment);

export default router;
