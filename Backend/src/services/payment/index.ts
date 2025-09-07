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
import { paymentLogger } from '../../shared/utils/logger';
import paymentRoutes from './routes/paymentRoutes';

const app = express();
const PORT = process.env.PAYMENT_SERVICE_PORT || 3007;

// Security middleware
app.use(helmet());
app.use(compression());
app.use(cors({ 
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000', 
  credentials: true 
}));

// Rate limiting
app.use('/api/payment', rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use(paymentLogger.requestLogger);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    service: 'payment',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API routes
app.use('/api/payment', paymentRoutes);

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
    // Connect to payment-db
    await getDatabaseConnection('payment-db');
    paymentLogger.logger.info('Connected to payment-db');

    // Connect to Redis
    await getRedisConnection();
    paymentLogger.logger.info('Connected to Redis');

    // Connect to RabbitMQ and subscribe to events
    const messageBroker = getMessageBroker();
    await messageBroker.connect();
    paymentLogger.logger.info('Connected to RabbitMQ');

    // Subscribe to relevant events
    await messageBroker.subscribeToEvents(
      'payment-service',
      [
        EVENT_TYPES.BOOKING_CREATED,
        EVENT_TYPES.BOOKING_CONFIRMED,
        EVENT_TYPES.BOOKING_CANCELLED,
        EVENT_TYPES.PRICING_POLICY_UPDATED,
        EVENT_TYPES.STUDENT_CREATED,
        EVENT_TYPES.STUDENT_UPDATED
      ],
      async (event) => {
        paymentLogger.logger.info('Received event', { 
          type: event.type, 
          data: event.data, 
          correlationId: event.correlationId 
        });

        try {
          switch (event.type) {
            case EVENT_TYPES.BOOKING_CREATED:
              // Create payment record for new booking
              break;
            case EVENT_TYPES.BOOKING_CONFIRMED:
              // Update payment status if needed
              break;
            case EVENT_TYPES.BOOKING_CANCELLED:
              // Process refund if payment was made
              break;
            case EVENT_TYPES.PRICING_POLICY_UPDATED:
              // Update payment amounts if needed
              break;
            case EVENT_TYPES.STUDENT_CREATED:
              // Cache student data for payment operations
              break;
            case EVENT_TYPES.STUDENT_UPDATED:
              // Update cached student data
              break;
            default:
              paymentLogger.logger.info('Event not handled', { type: event.type });
          }
        } catch (error) {
          paymentLogger.logger.error('Error processing event', { 
            type: event.type, 
            error: error.message 
          });
        }
      }
    );

    paymentLogger.logger.info('All services initialized successfully');
  } catch (error) {
    paymentLogger.logger.error('Failed to initialize services', { error });
    process.exit(1);
  }
};

// Start server
const startServer = async () => {
  try {
    await initializeServices();
    
    app.listen(PORT, () => {
      paymentLogger.logger.info(`Payment service started on port ${PORT}`);
      console.log(`🚀 Payment service running on port ${PORT}`);
    });
  } catch (error) {
    paymentLogger.logger.error('Failed to start server', { error });
    process.exit(1);
  }
};

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  paymentLogger.logger.info(`Received ${signal}, starting graceful shutdown`);
  
  try {
    // Close server
    process.exit(0);
  } catch (error) {
    paymentLogger.logger.error('Error during graceful shutdown', { error });
    process.exit(1);
  }
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  paymentLogger.logger.error('Uncaught exception', { error });
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  paymentLogger.logger.error('Unhandled rejection', { reason, promise });
  process.exit(1);
});

// Start the server
startServer();
