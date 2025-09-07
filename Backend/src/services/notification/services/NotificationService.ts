import { Notification, NotificationDocument } from '../models/Notification';
import { CreateNotificationInput, UpdateNotificationInput } from '../../../shared/utils/validation';
import { ConflictError, NotFoundError, ValidationError } from '../../../shared/utils/errors';
import { getMessageBroker, EVENT_TYPES } from '../../../shared/config/message-broker';
import { notificationLogger } from '../../../shared/utils/logger';
import { v4 as uuidv4 } from 'uuid';
import nodemailer from 'nodemailer';
import twilio from 'twilio';
import { getRedisConnection } from '../../../shared/config/redis';

export class NotificationService {
  private messageBroker = getMessageBroker();
  private emailTransporter: nodemailer.Transporter;
  private twilioClient: twilio.Twilio | null;
  private redis: any;

  constructor() {
    // Initialize email transporter
    this.emailTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    // Initialize Twilio client (only if credentials are provided)
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      this.twilioClient = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );
    } else {
      console.log('⚠️ Twilio credentials not provided, SMS notifications will be disabled');
      this.twilioClient = null;
    }

    // Initialize Redis connection
    this.initializeRedis();
  }

  private async initializeRedis(): Promise<void> {
    try {
      this.redis = await getRedisConnection();
    } catch (error) {
      notificationLogger.logger.warn('Redis connection failed, OTP storage will be disabled', { error });
      this.redis = null;
    }
  }

  /**
   * Store OTP in Redis
   */
  public async storeOTP(email: string, otp: string): Promise<void> {
    if (!this.redis) {
      notificationLogger.logger.warn('Redis not available, OTP not stored');
      return;
    }
    const key = `email_otp:${email}`;
    await this.redis.setex(key, 300, otp); // 5 minutes expiration
  }

  /**
   * Get stored OTP from Redis
   */
  private async getStoredOTP(email: string): Promise<string | null> {
    if (!this.redis) {
      return null;
    }
    const key = `email_otp:${email}`;
    return await this.redis.get(key);
  }

  public async createNotification(notificationData: CreateNotificationInput, createdBy?: string): Promise<NotificationDocument> {
    try {
      const notification = new Notification({
        ...notificationData,
        createdBy,
        metadata: {
          source: notificationData.metadata?.source || 'SYSTEM',
          eventType: notificationData.metadata?.eventType,
          eventId: notificationData.metadata?.eventId,
          correlationId: notificationData.metadata?.correlationId || uuidv4()
        }
      });

      const savedNotification = await notification.save();

      // Publish notification send requested event
      await this.messageBroker.publishEvent({
        id: uuidv4(),
        type: EVENT_TYPES.NOTIFICATION_SEND_REQUESTED,
        service: 'notification-service',
        data: {
          notificationId: savedNotification._id,
          type: savedNotification.type,
          recipient: savedNotification.recipient,
          category: savedNotification.category
        },
        timestamp: new Date(),
        correlationId: savedNotification.metadata.correlationId
      });

      notificationLogger.logger.info('Notification created', { 
        notificationId: savedNotification._id, 
        type: savedNotification.type,
        category: savedNotification.category 
      });
      return savedNotification;
    } catch (error) {
      notificationLogger.logger.error('Failed to create notification', { error, notificationData });
      throw error;
    }
  }

  public async getNotificationById(notificationId: string): Promise<NotificationDocument> {
    const notification = await Notification.findById(notificationId)
      .populate('recipient.userId', 'fullName email')
      .populate('recipient.studentId', 'fullName enrollmentNo');

    if (!notification) {
      throw new NotFoundError('Notification not found');
    }

    return notification;
  }

  public async updateNotification(notificationId: string, updateData: UpdateNotificationInput, updatedBy?: string): Promise<NotificationDocument> {
    const notification = await Notification.findById(notificationId);
    if (!notification) {
      throw new NotFoundError('Notification not found');
    }

    // Check if notification can be updated
    if (notification.status === 'SENT' || notification.status === 'DELIVERED') {
      throw new ValidationError('Cannot update sent or delivered notification');
    }

    Object.assign(notification, updateData, { updatedBy });
    const updatedNotification = await notification.save();

    notificationLogger.logger.info('Notification updated', { 
      notificationId: updatedNotification._id, 
      status: updatedNotification.status 
    });
    return updatedNotification;
  }

  public async getNotifications(page: number = 1, limit: number = 10, filters: any = {}): Promise<{
    notifications: NotificationDocument[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const query: any = {};

    // Apply filters
    if (filters.type) query.type = filters.type;
    if (filters.category) query.category = filters.category;
    if (filters.status) query.status = filters.status;
    if (filters.priority) query.priority = filters.priority;
    if (filters.recipientId) {
      query.$or = [
        { 'recipient.userId': filters.recipientId },
        { 'recipient.studentId': filters.recipientId }
      ];
    }
    if (filters.sentDate) {
      query['delivery.sentAt'] = { $gte: new Date(filters.sentDate) };
    }

    const skip = (page - 1) * limit;
    const [notifications, total] = await Promise.all([
      Notification.find(query)
        .populate('recipient.userId', 'fullName email')
        .populate('recipient.studentId', 'fullName enrollmentNo')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Notification.countDocuments(query)
    ]);

    return {
      notifications,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  public async getNotificationsByRecipient(recipientId: string, type?: string): Promise<NotificationDocument[]> {
    const query: any = {
      $or: [
        { 'recipient.userId': recipientId },
        { 'recipient.studentId': recipientId }
      ]
    };
    if (type) query.type = type;
    
    return Notification.find(query)
      .populate('recipient.userId', 'fullName email')
      .populate('recipient.studentId', 'fullName enrollmentNo');
  }

  public async sendNotification(notificationId: string): Promise<NotificationDocument> {
    const notification = await Notification.findById(notificationId);
    if (!notification) {
      throw new NotFoundError('Notification not found');
    }

    if (notification.status !== 'PENDING') {
      throw new ValidationError('Notification is not in pending state');
    }

    try {
      let providerResponse;
      switch (notification.type) {
        case 'EMAIL':
          providerResponse = await this.sendEmail(notification);
          break;
        case 'SMS':
          providerResponse = await this.sendSMS(notification);
          break;
        case 'PUSH':
          providerResponse = await this.sendPushNotification(notification);
          break;
        case 'WHATSAPP':
          providerResponse = await this.sendWhatsApp(notification);
          break;
        case 'IN_APP':
          providerResponse = await this.sendInAppNotification(notification);
          break;
        default:
          throw new ValidationError('Unsupported notification type');
      }

      // Update notification status
      notification.status = 'SENT';
      notification.delivery.sentAt = new Date();
      notification.delivery.providerResponse = providerResponse;
      await notification.save();

      // Publish notification sent event
      await this.messageBroker.publishEvent({
        id: uuidv4(),
        type: EVENT_TYPES.NOTIFICATION_SENT,
        service: 'notification-service',
        data: {
          notificationId: notification._id,
          type: notification.type,
          status: notification.status,
          provider: providerResponse.provider
        },
        timestamp: new Date(),
        correlationId: notification.metadata.correlationId
      });

      notificationLogger.logger.info('Notification sent successfully', { 
        notificationId: notification._id, 
        type: notification.type,
        provider: providerResponse.provider 
      });
      return notification;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      await notification.markAsFailed({ error: errorMessage, response: error });
      
      notificationLogger.logger.error('Notification sending failed', { 
        notificationId: notification._id, 
        error: errorMessage 
      });
      throw error;
    }
  }

  public async retryNotification(notificationId: string): Promise<NotificationDocument> {
    const notification = await Notification.findById(notificationId);
    if (!notification) {
      throw new NotFoundError('Notification not found');
    }

    if (!notification.canRetry()) {
      throw new ValidationError('Notification cannot be retried');
    }

    // Reset notification to pending state for retry
    notification.status = 'PENDING';
    notification.delivery.nextRetryAt = undefined;
    await notification.save();

    notificationLogger.logger.info('Notification retry initiated', { 
      notificationId: notification._id, 
      retryAttempts: notification.delivery.retryCount 
    });
    return notification;
  }

  public async scheduleNotification(notificationId: string, scheduledAt: Date): Promise<NotificationDocument> {
    const notification = await Notification.findById(notificationId);
    if (!notification) {
      throw new NotFoundError('Notification not found');
    }

    notification.delivery.scheduledAt = scheduledAt;
    await notification.save();

    notificationLogger.logger.info('Notification scheduled', { 
      notificationId: notification._id, 
      scheduledAt 
    });
    return notification;
  }

  public async cancelNotification(notificationId: string): Promise<NotificationDocument> {
    const notification = await Notification.findById(notificationId);
    if (!notification) {
      throw new NotFoundError('Notification not found');
    }

    notification.status = 'CANCELLED';
    await notification.save();

    notificationLogger.logger.info('Notification cancelled', { notificationId: notification._id });
    return notification;
  }

  public async getNotificationStatistics(): Promise<any> {
    const stats = await Notification.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const typeStats = await Notification.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      }
    ]);

    const categoryStats = await Notification.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      }
    ]);

    const totalNotifications = await Notification.countDocuments();
    const pendingNotifications = await Notification.countDocuments({ status: 'PENDING' });
    const failedNotifications = await Notification.countDocuments({ status: 'FAILED' });

    return {
      byStatus: stats,
      byType: typeStats,
      byCategory: categoryStats,
      totalNotifications,
      pendingNotifications,
      failedNotifications
    };
  }

  public async getPendingNotifications(): Promise<NotificationDocument[]> {
    return Notification.find({ status: 'PENDING' })
      .populate('recipient.userId', 'fullName email')
      .populate('recipient.studentId', 'fullName enrollmentNo');
  }

  public async getFailedNotifications(): Promise<NotificationDocument[]> {
    return Notification.find({ status: 'FAILED' })
      .populate('recipient.userId', 'fullName email')
      .populate('recipient.studentId', 'fullName enrollmentNo');
  }

  // Private methods for different notification channels
  private async sendEmail(notification: NotificationDocument): Promise<any> {
    const mailOptions = {
      from: process.env.SMTP_FROM,
      to: notification.recipient.email,
      subject: notification.content.subject || 'Hostel Management Notification',
      html: notification.content.message,
      attachments: notification.content.attachments?.map(att => ({
        filename: att.fileName,
        path: att.fileUrl
      })) || []
    };

    const result = await this.emailTransporter.sendMail(mailOptions);
    return {
      provider: 'SMTP',
      response: result
    };
  }

  private async sendSMS(notification: NotificationDocument): Promise<any> {
    if (!this.twilioClient) {
      throw new Error('Twilio client not initialized. SMS notifications are disabled.');
    }

    const result = await this.twilioClient.messages.create({
      body: notification.content.message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: notification.recipient.phone!
    });

    return {
      provider: 'TWILIO',
      response: result
    };
  }

  private async sendPushNotification(notification: NotificationDocument): Promise<any> {
    // This would integrate with Firebase Cloud Messaging or similar
    // For now, we'll simulate the response
    const result = {
      messageId: `push_${Date.now()}`,
      success: true
    };

    return {
      provider: 'FCM',
      response: result
    };
  }

  private async sendWhatsApp(notification: NotificationDocument): Promise<any> {
    // This would integrate with WhatsApp Business API
    // For now, we'll simulate the response
    const result = {
      messageId: `whatsapp_${Date.now()}`,
      status: 'sent'
    };

    return {
      provider: 'WHATSAPP_API',
      response: result
    };
  }

  private async sendInAppNotification(notification: NotificationDocument): Promise<any> {
    // This would store the notification for in-app display
    // For now, we'll simulate the response
    const result = {
      notificationId: notification.notificationId,
      stored: true
    };

    return {
      provider: 'IN_APP',
      response: result
    };
  }
}

export const notificationService = new NotificationService();
