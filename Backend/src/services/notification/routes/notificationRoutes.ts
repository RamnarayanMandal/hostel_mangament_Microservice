import { Router } from 'express';
import { notificationController } from '../controllers/NotificationController';
import { validateRequest, createNotificationSchema, updateNotificationSchema, paginationSchema, idParamSchema } from '../../../shared/utils/validation';
import { authenticate, requireAdmin, requireStaff } from '../../../shared/middleware/auth';

const router = Router();

// Public health check
router.get('/health', notificationController.health);

// Apply authentication to all other routes
router.use(authenticate);

// Notification Management Routes
router.post('/notifications', validateRequest(createNotificationSchema), notificationController.createNotification);
router.get('/notifications', validateRequest(paginationSchema), notificationController.getNotifications);
router.get('/notifications/:id', validateRequest(idParamSchema), notificationController.getNotificationById);
router.patch('/notifications/:id', validateRequest({ ...idParamSchema, ...updateNotificationSchema }), notificationController.updateNotification);

// Notification by Recipient Routes
router.get('/notifications/recipient/:recipientId', notificationController.getNotificationsByRecipient);

// Notification Sending Routes
router.post('/notifications/:id/send', validateRequest(idParamSchema), notificationController.sendNotification);
router.post('/notifications/:id/retry', validateRequest(idParamSchema), notificationController.retryNotification);
router.post('/notifications/:id/schedule', validateRequest(idParamSchema), notificationController.scheduleNotification);
router.post('/notifications/:id/cancel', validateRequest(idParamSchema), notificationController.cancelNotification);

// Bulk Operations Routes
router.post('/notifications/bulk', notificationController.sendBulkNotifications);
router.post('/notifications/template', notificationController.sendTemplateNotification);

// Analytics and Reporting Routes (Admin/Staff only)
router.get('/statistics', requireAdmin, notificationController.getNotificationStatistics);
router.get('/pending', requireStaff, notificationController.getPendingNotifications);
router.get('/failed', requireStaff, notificationController.getFailedNotifications);

export default router;
