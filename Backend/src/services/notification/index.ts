import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import 'express-async-errors';

import { getDatabaseConnection } from '../../shared/config/database';
import { getRedisConnection } from '../../shared/config/redis';
import { getMessageBroker, EVENT_TYPES } from '../../shared/config/message-broker';
import { errorHandler } from '../../shared/utils/errors';
import { notificationLogger } from '../../shared/utils/logger';
import notificationRoutes from './routes/notificationRoutes';
import { notificationService } from './services/NotificationService';

const app = express();
const PORT = process.env.NOTIFICATION_SERVICE_PORT || 3008;

// Security middleware
app.use(helmet());
app.use(compression());
app.use(cors({ 
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000', 
  credentials: true 
}));

// Rate limiting
app.use('/api/notification', rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use(notificationLogger.requestLogger);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    service: 'notification',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API routes
app.use('/api/notification', notificationRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.originalUrl
  });
});

// Global error handler
app.use(errorHandler);

// Initialize services
const initializeServices = async () => {
  try {
    // Connect to notification-db
    await getDatabaseConnection('notification-db');
    notificationLogger.logger.info('Connected to notification-db');

    // Connect to Redis
    await getRedisConnection();
    notificationLogger.logger.info('Connected to Redis');

    // Connect to RabbitMQ and subscribe to events
    const messageBroker = getMessageBroker();
    await messageBroker.connect();
    notificationLogger.logger.info('Connected to RabbitMQ');

    // Subscribe to relevant events
    await messageBroker.subscribeToEvents(
      'notification-service',
      [
        EVENT_TYPES.BOOKING_CREATED,
        EVENT_TYPES.BOOKING_CONFIRMED,
        EVENT_TYPES.BOOKING_CANCELLED,
        EVENT_TYPES.BOOKING_CHECKED_IN,
        EVENT_TYPES.BOOKING_CHECKED_OUT,
        EVENT_TYPES.PAYMENT_SUCCEEDED,
        EVENT_TYPES.PAYMENT_FAILED,
        EVENT_TYPES.REFUND_PROCESSED,
        EVENT_TYPES.ALLOCATION_REQUEST_ALLOCATED,
        EVENT_TYPES.ALLOCATION_REQUEST_WAITLISTED,
        EVENT_TYPES.STUDENT_CREATED,
        EVENT_TYPES.STUDENT_UPDATED,
        EVENT_TYPES.NOTIFICATION_SEND_REQUESTED
      ],
      async (event) => {
        notificationLogger.logger.info('Received event', { 
          type: event.type, 
          data: event.data, 
          correlationId: event.correlationId 
        });

        try {
          switch (event.type) {
            case EVENT_TYPES.BOOKING_CREATED:
              // Send booking confirmation notification
              break;
            case EVENT_TYPES.BOOKING_CONFIRMED:
              // Send booking confirmed notification
              break;
            case EVENT_TYPES.BOOKING_CANCELLED:
              // Send booking cancellation notification
              break;
            case EVENT_TYPES.BOOKING_CHECKED_IN:
              // Send check-in confirmation notification
              break;
            case EVENT_TYPES.BOOKING_CHECKED_OUT:
              // Send check-out confirmation notification
              break;
            case EVENT_TYPES.PAYMENT_SUCCEEDED:
              // Send payment success notification
              break;
            case EVENT_TYPES.PAYMENT_FAILED:
              // Send payment failure notification
              break;
            case EVENT_TYPES.REFUND_PROCESSED:
              // Send refund confirmation notification
              break;
            case EVENT_TYPES.ALLOCATION_REQUEST_ALLOCATED:
              // Send allocation success notification
              break;
            case EVENT_TYPES.ALLOCATION_REQUEST_WAITLISTED:
              // Send waitlist notification
              break;
            case EVENT_TYPES.STUDENT_CREATED:
              // Send OTP email for email verification
              if (event.data && event.data.email) {
                try {
                  // Generate OTP (6-digit random number)
                  const otp = Math.floor(100000 + Math.random() * 900000).toString();
                  
                  // Create notification for OTP email
                  await notificationService.createNotification({
                    type: 'EMAIL',
                    category: 'SYSTEM',
                    priority: 'HIGH',
                    recipient: {
                      email: event.data.email,
                      userId: event.data.userId
                    },
                    content: {
                      subject: 'Email Verification OTP',
                      title: 'Email Verification',
                      message: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                          <h2 style="color: #333; text-align: center;">Welcome to Hostel Management System</h2>
                          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <p style="margin: 0; font-size: 16px; color: #666;">
                              Your verification code is:
                            </p>
                            <h1 style="margin: 10px 0; font-size: 32px; color: #007bff; text-align: center; letter-spacing: 4px;">
                              ${otp}
                            </h1>
                          </div>
                          <p style="color: #666; font-size: 14px;">
                            This code will expire in 5 minutes.
                          </p>
                          <p style="color: #999; font-size: 12px;">
                            If you didn't request this code, please ignore this email.
                          </p>
                        </div>
                      `
                    },
                    metadata: {
                      source: 'SYSTEM',
                      eventType: 'STUDENT_CREATED',
                      eventId: event.id,
                      correlationId: event.correlationId
                    }
                  });

                  notificationLogger.logger.info('OTP notification created for student', { 
                    email: event.data.email, 
                    userId: event.data.userId 
                  });
                } catch (error) {
                  notificationLogger.logger.error('Failed to create OTP notification for student', { 
                    email: event.data.email, 
                    error: (error as Error).message 
                  });
                }
              }
              break;
            case EVENT_TYPES.STUDENT_UPDATED:
              // Send profile update notification if needed
              break;
            case EVENT_TYPES.NOTIFICATION_SEND_REQUESTED:
              // Send the notification
              if (event.data && event.data.notificationId) {
                try {
                  await notificationService.sendNotification(event.data.notificationId);
                  notificationLogger.logger.info('Notification sent successfully', { 
                    notificationId: event.data.notificationId 
                  });
                } catch (error) {
                  notificationLogger.logger.error('Failed to send notification', { 
                    notificationId: event.data.notificationId, 
                    error: (error as Error).message 
                  });
                }
              }
              break;
            default:
              notificationLogger.logger.info('Event not handled', { type: event.type });
          }
        } catch (error) {
          notificationLogger.logger.error('Error processing event', { 
            type: event.type, 
            error: (error as Error).message 
          });
        }
      }
    );

    notificationLogger.logger.info('All services initialized successfully');
  } catch (error) {
    notificationLogger.logger.error('Failed to initialize services', { error });
    process.exit(1);
  }
};

// Start server
const startServer = async () => {
  try {
    await initializeServices();
    
    app.listen(PORT, () => {
      notificationLogger.logger.info(`Notification service started on port ${PORT}`);
      console.log(`🚀 Notification service running on port ${PORT}`);
    });
  } catch (error) {
    notificationLogger.logger.error('Failed to start server', { error });
    process.exit(1);
  }
};

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  notificationLogger.logger.info(`Received ${signal}, starting graceful shutdown`);
  
  try {
    // Close server
    process.exit(0);
  } catch (error) {
    notificationLogger.logger.error('Error during graceful shutdown', { error });
    process.exit(1);
  }
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  notificationLogger.logger.error('Uncaught exception', { error });
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  notificationLogger.logger.error('Unhandled rejection', { reason, promise });
  process.exit(1);
});

// Start the server
startServer();
