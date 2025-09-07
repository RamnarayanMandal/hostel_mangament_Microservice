# Backend Setup Guide

## Environment Configuration

Create a `.env` file in the Backend directory with the following variables:

### Required Configuration

```env
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/hostel-management
MONGODB_URI_STUDENT=mongodb://localhost:27017/student-db
MONGODB_URI_HOSTEL=mongodb://localhost:27017/hostel-db
MONGODB_URI_ALLOCATION=mongodb://localhost:27017/allocation-db
MONGODB_URI_PRICING=mongodb://localhost:27017/pricing-db
MONGODB_URI_BOOKING=mongodb://localhost:27017/booking-db
MONGODB_URI_PAYMENT=mongodb://localhost:27017/payment-db
MONGODB_URI_NOTIFICATION=mongodb://localhost:27017/notification-db
MONGODB_URI_ADMIN=mongodb://localhost:27017/admin-db

# Redis Configuration
REDIS_URL=redis://localhost:6379

# RabbitMQ Configuration
RABBITMQ_URL=amqp://guest:guest@localhost:5672

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Email Configuration (Nodemailer)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=noreply@hostel-management.com

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001,http://localhost:3002

# Logging Configuration
LOG_LEVEL=info
NODE_ENV=development
```

### Optional Configuration

```env
# Firebase Configuration (for Firebase authentication)
FIREBASE_TYPE=service_account
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_PRIVATE_KEY_ID=your-private-key-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your-client-id
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
FIREBASE_AUTH_PROVIDER_X509_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
FIREBASE_CLIENT_X509_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxxxx%40your-project.iam.gserviceaccount.com
FIREBASE_DATABASE_URL=https://your-project.firebaseio.com

# Payment Gateway Configuration
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# SMS Configuration (Twilio)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890
```

## Prerequisites

1. **MongoDB**: Install and start MongoDB
2. **Redis**: Install and start Redis server
3. **RabbitMQ**: Install and start RabbitMQ server (optional - services will work without it)

## Installation

```bash
cd Backend
npm install
```

## Running the Services

### Development Mode (All Services)
```bash
npm run dev
```

### Individual Services
```bash
# Gateway Service
npm run dev:gateway

# Auth Service
npm run dev:auth

# Student Service
npm run dev:student

# Hostel Service
npm run dev:hostel

# Allocation Service
npm run dev:allocation

# Pricing Service
npm run dev:pricing

# Booking Service
npm run dev:booking

# Payment Service
npm run dev:payment

# Notification Service
npm run dev:notification

# Admin Service
npm run dev:admin
```

## Service Ports

- Gateway: 3000
- Auth: 3001
- Student: 3002
- Hostel: 3003
- Allocation: 3004
- Pricing: 3005
- Booking: 3006
- Payment: 3007
- Notification: 3008
- Admin: 3009

## API Documentation

Once the services are running, visit:
- Main Gateway: http://localhost:3000
- API Documentation: http://localhost:3000/api/docs
- Health Check: http://localhost:3000/health

## Troubleshooting

### Common Issues

1. **Port Already in Use**: Make sure no other services are using the required ports
2. **MongoDB Connection**: Ensure MongoDB is running and accessible
3. **Redis Connection**: Ensure Redis server is running
4. **Firebase Configuration**: Firebase authentication is optional - services will work without it
5. **RabbitMQ Connection**: RabbitMQ is optional - services will work without it

### Error Messages

- **Firebase not configured**: This is normal if Firebase credentials are not provided
- **RabbitMQ connection failed**: This is normal if RabbitMQ is not running
- **Port conflicts**: Check if other services are using the same ports
