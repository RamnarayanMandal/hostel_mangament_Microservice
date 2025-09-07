import winston from 'winston';
import { config } from '../config/env';

const { combine, timestamp, printf, colorize, errors } = winston.format;

// Custom format for log messages
const logFormat = printf(({ level, message, timestamp, service, correlationId, ...meta }) => {
  let log = `${timestamp} [${service || 'unknown'}] ${level.toUpperCase()}: ${message}`;
  
  if (correlationId) {
    log += ` [${correlationId}]`;
  }
  
  if (Object.keys(meta).length > 0) {
    log += ` ${JSON.stringify(meta)}`;
  }
  
  return log;
});

// Create logger instance
const createLogger = (serviceName: string) => {
  const logger = winston.createLogger({
    level: config.server.nodeEnv === 'production' ? 'info' : 'debug',
    format: combine(
      timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      errors({ stack: true }),
      logFormat
    ),
    defaultMeta: { service: serviceName },
    transports: [
      // Console transport
      new winston.transports.Console({
        format: combine(
          colorize(),
          timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
          logFormat
        ),
      }),
      
      // File transport for errors
      new winston.transports.File({
        filename: `logs/${serviceName}-error.log`,
        level: 'error',
        format: combine(
          timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
          logFormat
        ),
      }),
      
      // File transport for all logs
      new winston.transports.File({
        filename: `logs/${serviceName}-combined.log`,
        format: combine(
          timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
          logFormat
        ),
      }),
    ],
  });

  // Add request logging method
  const requestLogger = (req: any, res: any, next: any) => {
    const start = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - start;
      const correlationId = req.headers['x-correlation-id'] || 'unknown';
      
      logger.info('HTTP Request', {
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        correlationId,
        userAgent: req.get('User-Agent'),
        ip: req.ip,
      });
    });
    
    next();
  };

  // Add error logging method
  const errorLogger = (error: any, req?: any) => {
    const correlationId = req?.headers['x-correlation-id'] || 'unknown';
    
    logger.error('Application Error', {
      message: error.message,
      stack: error.stack,
      correlationId,
      url: req?.url,
      method: req?.method,
      userId: req?.user?.userId,
    });
  };

  return {
    logger,
    requestLogger,
    errorLogger,
  };
};

// Create loggers for different services
export const authLogger = createLogger('auth-service');
export const studentLogger = createLogger('student-service');
export const hostelLogger = createLogger('hostel-service');
export const allocationLogger = createLogger('allocation-service');
export const pricingLogger = createLogger('pricing-service');
export const bookingLogger = createLogger('booking-service');
export const paymentLogger = createLogger('payment-service');
export const notificationLogger = createLogger('notification-service');
export const adminLogger = createLogger('admin-service');
export const gatewayLogger = createLogger('gateway');

// Default logger for shared utilities
export const defaultLogger = createLogger('shared');

// Export the createLogger function for custom services
export { createLogger };
