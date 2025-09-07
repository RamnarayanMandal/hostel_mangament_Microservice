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
import { pricingLogger } from '../../shared/utils/logger';
import pricingRoutes from './routes/pricingRoutes';

const app = express();
const PORT = process.env.PRICING_SERVICE_PORT || 3005;

// Security and middleware
app.use(helmet());
app.use(compression());
app.use(cors({ 
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000', 
  credentials: true 
}));

// Rate limiting
app.use('/api/pricing', rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use(pricingLogger.requestLogger);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'pricing',
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/api/pricing', pricingRoutes);

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
    // Connect to database
    await getDatabaseConnection('pricing-db');
    pricingLogger.logger.info('Connected to pricing-db');

    // Connect to Redis
    await getRedisConnection();
    pricingLogger.logger.info('Connected to Redis');

    // Connect to message broker
    const messageBroker = getMessageBroker();
    await messageBroker.connect();
    pricingLogger.logger.info('Connected to RabbitMQ');

    // Subscribe to relevant events
    await messageBroker.subscribeToEvents(
      'pricing-service',
      [
        EVENT_TYPES.HOSTEL_CREATED,
        EVENT_TYPES.HOSTEL_UPDATED,
        EVENT_TYPES.STUDENT_CREATED,
        EVENT_TYPES.STUDENT_UPDATED,
        EVENT_TYPES.BOOKING_CREATED,
        EVENT_TYPES.BOOKING_CONFIRMED,
        EVENT_TYPES.BOOKING_CANCELLED,
        EVENT_TYPES.PAYMENT_SUCCEEDED,
        EVENT_TYPES.PAYMENT_FAILED
      ],
      async (event) => {
        pricingLogger.logger.info('Received event', { 
          type: event.type, 
          data: event.data,
          correlationId: event.correlationId 
        });
        
        // Handle events based on type
        switch (event.type) {
          case EVENT_TYPES.HOSTEL_CREATED:
            // Initialize default pricing policies for new hostel
            break;
          case EVENT_TYPES.HOSTEL_UPDATED:
            // Update pricing policies if hostel details changed
            break;
          case EVENT_TYPES.STUDENT_CREATED:
            // Cache student data for fee calculations
            break;
          case EVENT_TYPES.STUDENT_UPDATED:
            // Update cached student data
            break;
          case EVENT_TYPES.BOOKING_CREATED:
            // Calculate and cache fee for booking
            break;
          case EVENT_TYPES.BOOKING_CONFIRMED:
            // Update fee calculations if needed
            break;
          case EVENT_TYPES.BOOKING_CANCELLED:
            // Handle refund calculations
            break;
          case EVENT_TYPES.PAYMENT_SUCCEEDED:
            // Update payment status and calculate late fees if applicable
            break;
          case EVENT_TYPES.PAYMENT_FAILED:
            // Handle failed payment scenarios
            break;
          default:
            pricingLogger.logger.info('Event not handled', { type: event.type });
        }
      }
    );

    pricingLogger.logger.info('All services initialized successfully');
  } catch (error) {
    pricingLogger.logger.error('Failed to initialize services', { error });
    process.exit(1);
  }
};

// Start server
const startServer = async () => {
  try {
    await initializeServices();
    
    app.listen(PORT, () => {
      pricingLogger.logger.info(`Pricing & Fee Policy Service running on port ${PORT}`);
    });
  } catch (error) {
    pricingLogger.logger.error('Failed to start server', { error });
    process.exit(1);
  }
};

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  pricingLogger.logger.info(`Received ${signal}, shutting down gracefully`);
  
  try {
    // Close database connection
    const dbConnection = getDatabaseConnection('pricing-db');
    if (dbConnection) {
      await dbConnection.disconnect();
    }

    // Close Redis connection
    const redisConnection = getRedisConnection();
    if (redisConnection) {
      await redisConnection.disconnect();
    }

    // Close message broker connection
    const messageBroker = getMessageBroker();
    await messageBroker.disconnect();

    pricingLogger.logger.info('Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    pricingLogger.logger.error('Error during graceful shutdown', { error });
    process.exit(1);
  }
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  pricingLogger.logger.error('Uncaught Exception', { error });
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  pricingLogger.logger.error('Unhandled Rejection', { reason, promise });
  process.exit(1);
});

// Start the server
startServer();






