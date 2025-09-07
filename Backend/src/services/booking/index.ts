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
import { bookingLogger } from '../../shared/utils/logger';
import bookingRoutes from './routes/bookingRoutes';

const app = express();
const PORT = process.env.BOOKING_SERVICE_PORT || 3006;

// Security middleware
app.use(helmet());
app.use(compression());
app.use(cors({ 
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000', 
  credentials: true 
}));

// Rate limiting
app.use('/api/booking', rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use(bookingLogger.requestLogger);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    service: 'booking',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API routes
app.use('/api/booking', bookingRoutes);

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
    // Connect to booking-db
    await getDatabaseConnection('booking-db');
    bookingLogger.logger.info('Connected to booking-db');

    // Connect to Redis
    await getRedisConnection();
    bookingLogger.logger.info('Connected to Redis');

    // Connect to RabbitMQ and subscribe to events
    const messageBroker = getMessageBroker();
    await messageBroker.connect();
    bookingLogger.logger.info('Connected to RabbitMQ');

    // Subscribe to relevant events
    await messageBroker.subscribeToEvents(
      'booking-service',
      [
        EVENT_TYPES.STUDENT_CREATED,
        EVENT_TYPES.STUDENT_UPDATED,
        EVENT_TYPES.HOSTEL_CREATED,
        EVENT_TYPES.HOSTEL_UPDATED,
        EVENT_TYPES.BED_ALLOCATED,
        EVENT_TYPES.BED_RELEASED,
        EVENT_TYPES.ALLOCATION_REQUEST_ALLOCATED,
        EVENT_TYPES.PAYMENT_SUCCEEDED,
        EVENT_TYPES.PAYMENT_SUCCEEDED,
        EVENT_TYPES.PAYMENT_FAILED,
        EVENT_TYPES.REFUND_PROCESSED
      ],
      async (event) => {
        bookingLogger.logger.info('Received event', { 
          type: event.type, 
          data: event.data, 
          correlationId: event.correlationId 
        });

        try {
          switch (event.type) {
            case EVENT_TYPES.STUDENT_CREATED:
              // Cache student data for booking operations
              break;
            case EVENT_TYPES.STUDENT_UPDATED:
              // Update cached student data
              break;
            case EVENT_TYPES.HOSTEL_CREATED:
              // Cache hostel data for booking operations
              break;
            case EVENT_TYPES.HOSTEL_UPDATED:
              // Update cached hostel data
              break;
            case EVENT_TYPES.BED_ALLOCATED:
              // Update bed availability status
              break;
            case EVENT_TYPES.BED_RELEASED:
              // Update bed availability status
              break;
            case EVENT_TYPES.ALLOCATION_REQUEST_ALLOCATED:
              // Create booking from allocation
              break;
            case EVENT_TYPES.PAYMENT_SUCCEEDED:
              // Update booking payment status
              break;
            case EVENT_TYPES.PAYMENT_FAILED:
              // Handle failed payment scenarios
              break;
            case EVENT_TYPES.REFUND_PROCESSED:
              // Update booking refund status
              break;
            default:
              bookingLogger.logger.info('Event not handled', { type: event.type });
          }
        } catch (error) {
          bookingLogger.logger.error('Error processing event', { 
            type: event.type, 
            error: (error as Error).message 
          });
        }
      }
    );

    bookingLogger.logger.info('All services initialized successfully');
  } catch (error) {
    bookingLogger.logger.error('Failed to initialize services', { error });
    process.exit(1);
  }
};

// Start server
const startServer = async () => {
  try {
    await initializeServices();
    
    app.listen(PORT, () => {
      bookingLogger.logger.info(`Booking service started on port ${PORT}`);
      console.log(`🚀 Booking service running on port ${PORT}`);
    });
  } catch (error) {
    bookingLogger.logger.error('Failed to start server', { error });
    process.exit(1);
  }
};

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  bookingLogger.logger.info(`Received ${signal}, starting graceful shutdown`);
  
  try {
    // Close server
    process.exit(0);
  } catch (error) {
    bookingLogger.logger.error('Error during graceful shutdown', { error });
    process.exit(1);
  }
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  bookingLogger.logger.error('Uncaught exception', { error });
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  bookingLogger.logger.error('Unhandled rejection', { reason, promise });
  process.exit(1);
});

// Start the server
startServer();






