import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import 'express-async-errors';

import { DatabaseConnection } from '../../shared/config/database';
import { RedisConnection } from '../../shared/config/redis';
import { getMessageBroker, EVENT_TYPES } from '../../shared/config/message-broker';
import { errorHandler } from '../../shared/utils/errors';
import { adminLogger } from '../../shared/utils/logger';

import adminRoutes from './routes/adminRoutes';
import studentRoutes from './routes/studentRoutes';
import staffRoutes from './routes/staffRoutes';

const app = express();
const PORT = process.env.ADMIN_PORT || 3009;

// Connect to database
const dbConnection = DatabaseConnection.getInstance();
const redisConnection = RedisConnection.getInstance();
const messageBroker = getMessageBroker();

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true
}));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    adminLogger.logger.info('Request processed', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
      userAgent: req.get('User-Agent'),
      ip: req.ip
    });
  });
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'admin',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API Routes
app.use('/api/admin', adminRoutes);
app.use('/api/admin/students', studentRoutes);
app.use('/api/admin/staff', staffRoutes);

// Error handling middleware
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', async () => {
  adminLogger.logger.info('SIGTERM received, shutting down gracefully');
  
  try {
    await dbConnection.disconnect();
    await redisConnection.disconnect();
    await messageBroker.disconnect();
    
    process.exit(0);
  } catch (error) {
    adminLogger.logger.error('Error during shutdown', { error: (error as Error).message });
    process.exit(1);
  }
});

process.on('SIGINT', async () => {
  adminLogger.logger.info('SIGINT received, shutting down gracefully');
  
  try {
    await dbConnection.disconnect();
    await redisConnection.disconnect();
    await messageBroker.disconnect();
    
    process.exit(0);
  } catch (error) {
    adminLogger.logger.error('Error during shutdown', { error: (error as Error).message });
    process.exit(1);
  }
});

// Start server
const startServer = async () => {
  try {
    // Connect to services
    await dbConnection.connect('admin-db');
    await redisConnection.connect();
    await messageBroker.connect();

    // Subscribe to events
    await messageBroker.subscribeToEvents('admin-service', [
      EVENT_TYPES.STUDENT_CREATED,
      EVENT_TYPES.STUDENT_UPDATED,
      EVENT_TYPES.HOSTEL_CREATED,
      EVENT_TYPES.HOSTEL_UPDATED,
      EVENT_TYPES.BOOKING_CREATED,
      EVENT_TYPES.BOOKING_CONFIRMED,
      EVENT_TYPES.BOOKING_CANCELLED,
      EVENT_TYPES.PAYMENT_SUCCEEDED,
      EVENT_TYPES.PAYMENT_FAILED,
      EVENT_TYPES.REFUND_PROCESSED
    ], async (message: any) => {
      adminLogger.logger.info('Event received', {
        type: message.type,
        service: message.service,
        timestamp: message.timestamp
      });
      
      // Handle events for admin reporting and auditing
      // For example, create audit logs, update statistics, etc.
    });

    app.listen(PORT, () => {
      adminLogger.logger.info(`Admin service started on port ${PORT}`);
    });

  } catch (error) {
    adminLogger.logger.error('Failed to start admin service', { error: (error as Error).message });
    process.exit(1);
  }
};

startServer();
