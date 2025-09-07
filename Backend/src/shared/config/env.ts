import dotenv from 'dotenv';
import path from 'path';

// Load environment variables with explicit path
dotenv.config({ path: path.join(__dirname, '../../../.env') });

export const config = {
  // Server configuration
  server: {
    port: process.env.PORT || 3010,
    nodeEnv: process.env.NODE_ENV || 'development',
  },

  // Database configuration
  database: {
    uri: process.env.MONGODB_URI || 'mongodb+srv://ramnarayan:Ram1234@cluster0.hk4ehir.mongodb.net',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    },
  },

  // Frontend configuration
  frontend: {
    url: process.env.FRONTEND_URL || 'http://localhost:3000',
  },

  // Redis configuration
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0'),
  },

  // RabbitMQ configuration
  rabbitmq: {
    host: process.env.RABBITMQ_HOST || 'localhost',
    port: parseInt(process.env.RABBITMQ_PORT || '5672'),
    username: process.env.RABBITMQ_USERNAME || 'guest',
    password: process.env.RABBITMQ_PASSWORD || 'guest',
    vhost: process.env.RABBITMQ_VHOST || '/',
  },

  // JWT configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  // CORS configuration
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true,
  },

  // Rate limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX || '100'),
  },

  // Payment gateways
  payment: {
    stripe: {
      secretKey: process.env.STRIPE_SECRET_KEY,
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    },
    razorpay: {
      keyId: process.env.RAZORPAY_KEY_ID,
      keySecret: process.env.RAZORPAY_KEY_SECRET,
      webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET,
    },
  },

  // Notification services
  notification: {
    twilio: {
      accountSid: process.env.TWILIO_ACCOUNT_SID,
      authToken: process.env.TWILIO_AUTH_TOKEN,
      phoneNumber: process.env.TWILIO_PHONE_NUMBER,
    },
    email: {
      host: process.env.SMTP_HOST || process.env.EMAIL_HOST,
      port: parseInt(process.env.SMTP_PORT || process.env.EMAIL_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true' || process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || process.env.EMAIL_USER,
        pass: process.env.SMTP_PASS || process.env.EMAIL_PASS,
      },
    },
  },

  // Service ports
  services: {
    auth: process.env.AUTH_PORT || 3001,
    student: process.env.STUDENT_PORT || 3002,
    hostel: process.env.HOSTEL_PORT || 3003,
    allocation: process.env.ALLOCATION_PORT || 3004,
    pricing: process.env.PRICING_PORT || 3005,
    booking: process.env.BOOKING_PORT || 3006,
    payment: process.env.PAYMENT_PORT || 3007,
    notification: process.env.NOTIFICATION_PORT || 3008,
    admin: process.env.ADMIN_PORT || 3009,
    gateway: process.env.GATEWAY_PORT || 3010,
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'json',
  },
};
