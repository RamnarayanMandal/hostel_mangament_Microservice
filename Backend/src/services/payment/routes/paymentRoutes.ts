import { Router } from 'express';
import { paymentController } from '../controllers/PaymentController';
import { validateRequest, createPaymentSchema, updatePaymentSchema, paginationSchema, idParamSchema } from '../../../shared/utils/validation';
import { authenticate, requireAdmin, requireStaff } from '../../../shared/middleware/auth';

const router = Router();

// Public health check
router.get('/health', paymentController.health);

// Webhook endpoints (no authentication required)
router.post('/webhooks/stripe', paymentController.handleStripeWebhook);
router.post('/webhooks/razorpay', paymentController.handleRazorpayWebhook);

// Apply authentication to all other routes
router.use(authenticate);

// Payment Management Routes
router.post('/payments', validateRequest(createPaymentSchema), paymentController.createPayment);
router.get('/payments', validateRequest(paginationSchema), paymentController.getPayments);
router.get('/payments/:id', validateRequest(idParamSchema), paymentController.getPaymentById);
router.patch('/payments/:id', validateRequest({ ...idParamSchema, ...updatePaymentSchema }), paymentController.updatePayment);

// Payment by Booking/Student Routes
router.get('/payments/booking/:bookingId', paymentController.getPaymentsByBooking);
router.get('/payments/student/:studentId', paymentController.getPaymentsByStudent);

// Payment Processing Routes
router.post('/payments/:id/process', validateRequest(idParamSchema), paymentController.processPayment);
router.post('/payments/:id/retry', validateRequest(idParamSchema), paymentController.retryPayment);
router.post('/payments/:id/refund', validateRequest(idParamSchema), paymentController.processRefund);

// Payment Intent Routes
router.post('/payments/:id/intent', validateRequest(idParamSchema), paymentController.generatePaymentIntent);

// Receipt Routes
router.post('/payments/:id/receipt', validateRequest(idParamSchema), paymentController.generateReceipt);

// Analytics and Reporting Routes (Admin/Staff only)
router.get('/statistics', requireAdmin, paymentController.getPaymentStatistics);
router.get('/failed', requireStaff, paymentController.getFailedPayments);
router.get('/pending', requireStaff, paymentController.getPendingPayments);

export default router;
