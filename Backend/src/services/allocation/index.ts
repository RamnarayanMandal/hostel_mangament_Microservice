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
import { allocationLogger } from '../../shared/utils/logger';
import allocationRoutes from './routes/allocationRoutes';

const app = express();
const PORT = process.env.ALLOCATION_SERVICE_PORT || 3004;

// Security and middleware
app.use(helmet());
app.use(compression());
app.use(cors({ 
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000', 
  credentials: true 
}));

// Rate limiting
app.use('/api/allocation', rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use(allocationLogger.requestLogger);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'allocation',
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/api/allocation', allocationRoutes);

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
    await getDatabaseConnection('allocation-db');
    allocationLogger.logger.info('Connected to allocation-db');

    // Connect to Redis
    await getRedisConnection();
    allocationLogger.logger.info('Connected to Redis');

    // Connect to message broker
    const messageBroker = getMessageBroker();
    await messageBroker.connect();
    allocationLogger.logger.info('Connected to RabbitMQ');

    // Subscribe to relevant events
    await messageBroker.subscribeToEvents(
      'allocation-service',
      [
        EVENT_TYPES.STUDENT_CREATED,
        EVENT_TYPES.STUDENT_UPDATED,
        EVENT_TYPES.HOSTEL_CREATED,
        EVENT_TYPES.HOSTEL_UPDATED,
        EVENT_TYPES.BED_ALLOCATED,
        EVENT_TYPES.BED_RELEASED,
        EVENT_TYPES.BOOKING_CREATED,
        EVENT_TYPES.BOOKING_CANCELLED
      ],
      async (event) => {
        allocationLogger.logger.info('Received event', { 
          type: event.type, 
          data: event.data,
          correlationId: event.correlationId 
        });
        
        // Handle events based on type
        switch (event.type) {
          case EVENT_TYPES.STUDENT_CREATED:
            // Update student data in allocation rules if needed
            break;
          case EVENT_TYPES.STUDENT_UPDATED:
            // Re-evaluate allocation requests for this student
            break;
          case EVENT_TYPES.HOSTEL_CREATED:
            // Update allocation rules that might include this hostel
            break;
          case EVENT_TYPES.HOSTEL_UPDATED:
            // Update allocation rules for this hostel
            break;
          case EVENT_TYPES.BED_ALLOCATED:
            // Update allocation request status
            break;
          case EVENT_TYPES.BED_RELEASED:
            // Check if any waitlisted requests can be allocated
            break;
          case EVENT_TYPES.BOOKING_CANCELLED:
            // Release allocation if booking is cancelled
            break;
          default:
            allocationLogger.logger.info('Event not handled', { type: event.type });
        }
      }
    );

    allocationLogger.logger.info('All services initialized successfully');
  } catch (error) {
    allocationLogger.logger.error('Failed to initialize services', { error });
    process.exit(1);
  }
};

// Start server
const startServer = async () => {
  try {
    await initializeServices();
    
    app.listen(PORT, () => {
      allocationLogger.logger.info(`Allocation Service running on port ${PORT}`);
    });
  } catch (error) {
    allocationLogger.logger.error('Failed to start server', { error });
    process.exit(1);
  }
};

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  allocationLogger.logger.info(`Received ${signal}, shutting down gracefully`);
  
  try {
    // Close database connection
    const dbConnection = getDatabaseConnection('allocation-db');
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

    allocationLogger.logger.info('Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    allocationLogger.logger.error('Error during graceful shutdown', { error });
    process.exit(1);
  }
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  allocationLogger.logger.error('Uncaught Exception', { error });
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  allocationLogger.logger.error('Unhandled Rejection', { reason, promise });
  process.exit(1);
});

// Start the server
startServer();
