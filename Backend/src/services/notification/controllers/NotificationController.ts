import { Request, Response } from 'express';
import { notificationService } from '../services/NotificationService';
import { validateRequest, createNotificationSchema, updateNotificationSchema, paginationSchema, idParamSchema } from '../../../shared/utils/validation';
import { authenticate, requireAdmin, requireStaff } from '../../../shared/middleware/auth';
import { asyncHandler, successResponse, errorResponse } from '../../../shared/utils/errors';
import { notificationLogger } from '../../../shared/utils/logger';

export class NotificationController {
  public createNotification = asyncHandler(async (req: Request, res: Response) => {
    const notification = await notificationService.createNotification(req.validatedData, req.user?.userId);
    res.status(201).json(successResponse('Notification created successfully', notification));
  });

  public getNotificationById = asyncHandler(async (req: Request, res: Response) => {
    const notification = await notificationService.getNotificationById(req.validatedData.id);
    res.json(successResponse('Notification retrieved successfully', notification));
  });

  public updateNotification = asyncHandler(async (req: Request, res: Response) => {
    const notification = await notificationService.updateNotification(req.validatedData.id, req.validatedData, req.user?.userId);
    res.json(successResponse('Notification updated successfully', notification));
  });

  public getNotifications = asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, ...filters } = req.validatedData;
    const result = await notificationService.getNotifications(page, limit, filters);
    res.json(successResponse('Notifications retrieved successfully', result));
  });

  public getNotificationsByRecipient = asyncHandler(async (req: Request, res: Response) => {
    const { type } = req.query;
    const notifications = await notificationService.getNotificationsByRecipient(req.params.recipientId, type as string);
    res.json(successResponse('Recipient notifications retrieved successfully', notifications));
  });

  public sendNotification = asyncHandler(async (req: Request, res: Response) => {
    const notification = await notificationService.sendNotification(req.params.id);
    res.json(successResponse('Notification sent successfully', notification));
  });

  public retryNotification = asyncHandler(async (req: Request, res: Response) => {
    const notification = await notificationService.retryNotification(req.params.id);
    res.json(successResponse('Notification retry initiated successfully', notification));
  });

  public scheduleNotification = asyncHandler(async (req: Request, res: Response) => {
    const { scheduledAt } = req.body;
    const notification = await notificationService.scheduleNotification(req.params.id, new Date(scheduledAt));
    res.json(successResponse('Notification scheduled successfully', notification));
  });

  public cancelNotification = asyncHandler(async (req: Request, res: Response) => {
    const notification = await notificationService.cancelNotification(req.params.id);
    res.json(successResponse('Notification cancelled successfully', notification));
  });

  public getNotificationStatistics = asyncHandler(async (req: Request, res: Response) => {
    const stats = await notificationService.getNotificationStatistics();
    res.json(successResponse('Notification statistics retrieved successfully', stats));
  });

  public getPendingNotifications = asyncHandler(async (req: Request, res: Response) => {
    const notifications = await notificationService.getPendingNotifications();
    res.json(successResponse('Pending notifications retrieved successfully', notifications));
  });

  public getFailedNotifications = asyncHandler(async (req: Request, res: Response) => {
    const notifications = await notificationService.getFailedNotifications();
    res.json(successResponse('Failed notifications retrieved successfully', notifications));
  });

  public sendBulkNotifications = asyncHandler(async (req: Request, res: Response) => {
    const { notifications } = req.body;
    const results = [];
    
    for (const notificationData of notifications) {
      try {
        const notification = await notificationService.createNotification(notificationData, req.user?.userId);
        results.push({ success: true, notificationId: notification._id });
      } catch (error) {
        results.push({ success: false, error: (error as Error).message });
      }
    }
    
    res.json(successResponse('Bulk notifications processed', { results }));
  });

  public sendTemplateNotification = asyncHandler(async (req: Request, res: Response) => {
    const { templateName, recipients, templateData } = req.body;
    
    // This would typically load a template and send to multiple recipients
    // For now, we'll create a simple notification
    const notification = await notificationService.createNotification({
      type: 'EMAIL',
      category: 'SYSTEM',
      priority: 'MEDIUM',
      recipient: recipients[0], // For simplicity, just use first recipient
      content: {
        subject: `Template: ${templateName}`,
        message: `This is a template notification for ${templateName}`,
        template: templateName,
        templateData
      }
    }, req.user?.userId);
    
    res.json(successResponse('Template notification created successfully', notification));
  });

  public health = asyncHandler(async (req: Request, res: Response) => {
    res.json(successResponse('Notification service is healthy', {
      service: 'notification',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    }));
  });
}

export const notificationController = new NotificationController();
