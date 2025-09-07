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
import { hostelLogger } from '../../shared/utils/logger';
import hostelRoutes from './routes/hostelRoutes';

const app = express();
const PORT = process.env.HOSTEL_PORT || 3003;

// Security and middleware
app.use(helmet());
app.use(compression());
app.use(cors({ 
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000', 
  credentials: true 
}));

// Rate limiting
app.use('/api/hostels', rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use(hostelLogger.requestLogger);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'hostel-registry',
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/api/hostels', hostelRoutes);

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
    await getDatabaseConnection('hostel-db');
    hostelLogger.logger.info('Connected to hostel-db');

    // Connect to Redis
    await getRedisConnection();
    hostelLogger.logger.info('Connected to Redis');

    // Connect to message broker
    const messageBroker = getMessageBroker();
    await messageBroker.connect();
    hostelLogger.logger.info('Connected to RabbitMQ');

    // Subscribe to relevant events
    await messageBroker.subscribeToEvents(
      'hostel-service',
      [
        EVENT_TYPES.STUDENT_CREATED,
        EVENT_TYPES.STUDENT_UPDATED,
        EVENT_TYPES.BOOKING_CREATED,
        EVENT_TYPES.BOOKING_CONFIRMED,
        EVENT_TYPES.BOOKING_CANCELLED,
        EVENT_TYPES.BOOKING_CHECKED_IN,
        EVENT_TYPES.BOOKING_CHECKED_OUT
      ],
      async (event) => {
        hostelLogger.logger.info('Received event', { 
          type: event.type, 
          data: event.data,
          correlationId: event.correlationId 
        });
        
        // Handle events based on type
        switch (event.type) {
          case EVENT_TYPES.BOOKING_CHECKED_IN:
            // Update bed status to allocated
            break;
          case EVENT_TYPES.BOOKING_CHECKED_OUT:
            // Release bed
            break;
          case EVENT_TYPES.BOOKING_CANCELLED:
            // Release bed if allocated
            break;
          default:
            hostelLogger.logger.info('Event not handled', { type: event.type });
        }
      }
    );

    hostelLogger.logger.info('All services initialized successfully');
  } catch (error) {
    hostelLogger.logger.error('Failed to initialize services', { error });
    process.exit(1);
  }
};

// Start server
const startServer = async () => {
  try {
    await initializeServices();
    
    app.listen(PORT, () => {
      hostelLogger.logger.info(`Hostel Registry Service running on port ${PORT}`);
    });
  } catch (error) {
    hostelLogger.logger.error('Failed to start server', { error });
    process.exit(1);
  }
};

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  hostelLogger.logger.info(`Received ${signal}, shutting down gracefully`);
  
  try {
    // Close database connection
    const dbConnection = getDatabaseConnection('hostel-db');
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

    hostelLogger.logger.info('Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    hostelLogger.logger.error('Error during graceful shutdown', { error });
    process.exit(1);
  }
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  hostelLogger.logger.error('Uncaught Exception', { error });
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  hostelLogger.logger.error('Unhandled Rejection', { reason, promise });
  process.exit(1);
});

// Start the server
startServer();
