import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import 'express-async-errors';

import { config } from '../../shared/config/env';
import { getDatabaseConnection, checkMongoDBAvailability } from '../../shared/config/database';
import { getRedisConnection } from '../../shared/config/redis';
import { getMessageBroker, EVENT_TYPES } from '../../shared/config/message-broker';
import { errorHandler } from '../../shared/utils/errors';
import { authLogger } from '../../shared/utils/logger';
import authRoutes from './routes/authRoutes';

const app = express();
const PORT = config.services.auth;

// Security middleware
app.use(helmet());
app.use(compression());

// CORS configuration
app.use(cors({
  origin: [
    ...config.cors.origin,
    'http://localhost:3001',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001'
  ],
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/auth', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use(authLogger.requestLogger);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Auth Service is running',
    timestamp: new Date().toISOString(),
    service: 'auth-service',
  });
});

// API routes
app.use('/api/auth', authRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    timestamp: new Date().toISOString(),
  });
});

// Global error handler
app.use(errorHandler);

// Initialize services
const initializeServices = async () => {
  try {
    // Check MongoDB availability first
    authLogger.logger.info('Checking MongoDB availability...');
    const isMongoDBAvailable = await checkMongoDBAvailability();
    
    if (!isMongoDBAvailable) {
      authLogger.logger.error('MongoDB is not available. Please ensure MongoDB is running.');
      authLogger.logger.info('To start MongoDB:');
      authLogger.logger.info('1. Start Docker Desktop');
      authLogger.logger.info('2. Run: docker-compose up -d mongodb');
      authLogger.logger.info('3. Or install MongoDB locally and start the service');
      throw new Error('MongoDB is not available');
    }

    // Connect to database
    authLogger.logger.info('Connecting to identity-db...');
    await getDatabaseConnection('identity-db');
    authLogger.logger.info('Connected to identity-db');

    // Check if Redis and RabbitMQ are disabled
    const disableRedis = process.env.DISABLE_REDIS === 'true';
    const disableRabbitMQ = process.env.DISABLE_RABBITMQ === 'true';

    if (!disableRedis) {
      try {
        await getRedisConnection();
        authLogger.logger.info('Connected to Redis');
      } catch (error) {
        authLogger.logger.warn('Redis connection failed, continuing without Redis');
      }
    } else {
      authLogger.logger.info('Redis disabled for development');
    }

    if (!disableRabbitMQ) {
      try {
        await getMessageBroker().connect();
        authLogger.logger.info('Connected to message broker');

        // Subscribe to events
        await getMessageBroker().subscribeToEvents(
          'auth-service',
          [
            EVENT_TYPES.STUDENT_CREATED,
            EVENT_TYPES.STUDENT_UPDATED,
          ],
          async (event) => {
            authLogger.logger.info('Received event', { type: event.type, data: event.data });
            // Handle events as needed
          }
        );
      } catch (error) {
        authLogger.logger.warn('Message broker connection failed, continuing without message broker');
      }
    } else {
      authLogger.logger.info('RabbitMQ disabled for development');
    }

    authLogger.logger.info('All services initialized successfully');

  } catch (error) {
    authLogger.logger.error('Failed to initialize services', { error: error instanceof Error ? error.message : String(error) });
    process.exit(1);
  }
};

// Start server
const startServer = async () => {
  try {
    await initializeServices();
    
    app.listen(PORT, () => {
      authLogger.logger.info(`Auth Service started on port ${PORT}`);
      console.log(`🚀 Auth Service running on port ${PORT}`);
      console.log(`📧 Service: Auth & Identity`);
      console.log(`🔐 JWT authentication enabled`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    authLogger.logger.error('Failed to start server', { error: error instanceof Error ? error.message : String(error) });
    process.exit(1);
  }
};

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  authLogger.logger.info(`Received ${signal}, shutting down gracefully`);
  
  try {
    // Close server
    process.exit(0);
  } catch (error) {
    authLogger.logger.error('Error during shutdown', { error: error instanceof Error ? error.message : String(error) });
    process.exit(1);
  }
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  authLogger.logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  authLogger.logger.error('Unhandled Rejection', { reason, promise });
  process.exit(1);
});

// Start the server
startServer();
