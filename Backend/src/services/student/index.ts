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
import { studentLogger } from '../../shared/utils/logger';
import studentRoutes from './routes/studentRoutes';

const app = express();
const PORT = process.env.STUDENT_SERVICE_PORT || 3002;

// Security middleware
app.use(helmet());
app.use(compression());

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/students', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use(studentLogger.requestLogger);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Student Service is running',
    timestamp: new Date().toISOString(),
    service: 'student-service',
  });
});

// API routes
app.use('/api/students', studentRoutes);

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
    // Connect to database
    await getDatabaseConnection('student-db');
    studentLogger.logger.info('Connected to student-db');

    // Connect to Redis
    await getRedisConnection();
    studentLogger.logger.info('Connected to Redis');

    // Connect to message broker
    await getMessageBroker().connect();
    studentLogger.logger.info('Connected to message broker');

    // Subscribe to events
    await getMessageBroker().subscribeToEvents(
      'student-service',
      [
        EVENT_TYPES.STUDENT_CREATED,
        EVENT_TYPES.STUDENT_UPDATED,
      ],
      async (event) => {
        studentLogger.logger.info('Received event', { type: event.type, data: event.data });
        // Handle events as needed
      }
    );

    studentLogger.logger.info('All services initialized successfully');
  } catch (error) {
    studentLogger.logger.error('Failed to initialize services', { error: (error as Error).message });
    process.exit(1);
  }
};

// Start server
const startServer = async () => {
  try {
    await initializeServices();
    
    app.listen(PORT, () => {
      studentLogger.logger.info(`Student Service started on port ${PORT}`);
      console.log(`🚀 Student Service running on port ${PORT}`);
      console.log(`👨‍🎓 Service: Student Management`);
      console.log(`📚 KYC verification enabled`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    studentLogger.logger.error('Failed to start server', { error: (error as Error).message });
    process.exit(1);
  }
};

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  studentLogger.logger.info(`Received ${signal}, shutting down gracefully`);
  
  try {
    // Close server
    process.exit(0);
  } catch (error) {
    studentLogger.logger.error('Error during shutdown', { error: (error as Error).message });
    process.exit(1);
  }
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  studentLogger.logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  studentLogger.logger.error('Unhandled Rejection', { reason, promise });
  process.exit(1);
});

// Start the server
startServer();
