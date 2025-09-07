import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Hostel Management API',
      version: '1.0.0',
      description: 'API documentation for Hostel Management Microservices System',
      contact: {
        name: 'API Support',
        email: 'support@hostelmanagement.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:3010',
        description: 'Development server'
      },
      {
        url: 'http://localhost:3001',
        description: 'Auth Service'
      },
      {
        url: 'http://localhost:3002',
        description: 'Student Service'
      },
      {
        url: 'http://localhost:3003',
        description: 'Hostel Service'
      },
      {
        url: 'http://localhost:3004',
        description: 'Allocation Service'
      },
      {
        url: 'http://localhost:3005',
        description: 'Pricing Service'
      },
      {
        url: 'http://localhost:3006',
        description: 'Booking Service'
      },
      {
        url: 'http://localhost:3007',
        description: 'Payment Service'
      },
      {
        url: 'http://localhost:3008',
        description: 'Notification Service'
      },
      {
        url: 'http://localhost:3009',
        description: 'Admin Service'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error message'
            },
            statusCode: {
              type: 'number',
              description: 'HTTP status code'
            }
          }
        },
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            email: { type: 'string' },
            fullName: { type: 'string' },
            role: { type: 'string', enum: ['STUDENT', 'ADMIN', 'STAFF'] },
            phone: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        },
        StudentProfile: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            userId: { type: 'string' },
            enrollmentNo: { type: 'string' },
            program: { type: 'string' },
            year: { type: 'number' },
            semester: { type: 'number' },
            category: { type: 'string' },
            domicileState: { type: 'string' },
            seniorityScore: { type: 'number' },
            kycStatus: { type: 'string', enum: ['PENDING', 'VERIFIED', 'REJECTED'] }
          }
        },
        Hostel: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string' },
            campus: { type: 'string' },
            address: { type: 'string' },
            amenities: { type: 'array', items: { type: 'string' } }
          }
        },
        Room: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            hostelId: { type: 'string' },
            number: { type: 'string' },
            type: { type: 'string', enum: ['SINGLE', 'DOUBLE', 'TRIPLE', 'DORM'] },
            genderPolicy: { type: 'string', enum: ['MALE', 'FEMALE', 'ANY'] },
            priceTier: { type: 'string' },
            status: { type: 'string', enum: ['OPEN', 'MAINTENANCE'] }
          }
        },
        Bed: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            roomId: { type: 'string' },
            bedNo: { type: 'string' },
            status: { type: 'string', enum: ['AVAILABLE', 'ON_HOLD', 'ALLOCATED', 'BLOCKED'] },
            occupantBookingId: { type: 'string' },
            holdExpiresAt: { type: 'string', format: 'date-time' }
          }
        },
        Booking: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            studentId: { type: 'string' },
            hostelId: { type: 'string' },
            roomId: { type: 'string' },
            bedId: { type: 'string' },
            status: { type: 'string', enum: ['HOLD', 'PENDING_PAYMENT', 'CONFIRMED', 'CANCELLED', 'CHECKED_IN', 'CHECKED_OUT'] },
            startDate: { type: 'string', format: 'date-time' },
            endDate: { type: 'string', format: 'date-time' },
            amountDue: { type: 'number' },
            currency: { type: 'string', enum: ['INR', 'USD'] }
          }
        },
        Payment: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            bookingId: { type: 'string' },
            provider: { type: 'string', enum: ['RAZORPAY', 'STRIPE'] },
            amount: { type: 'number' },
            currency: { type: 'string' },
            status: { type: 'string', enum: ['CREATED', 'SUCCEEDED', 'FAILED', 'REFUNDED'] },
            providerRef: { type: 'string' }
          }
        },
        Notification: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            type: { type: 'string', enum: ['EMAIL', 'SMS', 'PUSH', 'WHATSAPP', 'IN_APP'] },
            recipient: {
              type: 'object',
              properties: {
                userId: { type: 'string' },
                studentId: { type: 'string' },
                email: { type: 'string' },
                phone: { type: 'string' }
              }
            },
            content: {
              type: 'object',
              properties: {
                subject: { type: 'string' },
                message: { type: 'string' }
              }
            },
            status: { type: 'string', enum: ['PENDING', 'SENT', 'DELIVERED', 'FAILED', 'CANCELLED'] },
            priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] }
          }
        }
      }
    },
    tags: [
      { name: 'Auth', description: 'Authentication endpoints' },
      { name: 'Students', description: 'Student management endpoints' },
      { name: 'Hostels', description: 'Hostel management endpoints' },
      { name: 'Rooms', description: 'Room management endpoints' },
      { name: 'Beds', description: 'Bed management endpoints' },
      { name: 'Allocations', description: 'Allocation management endpoints' },
      { name: 'Bookings', description: 'Booking management endpoints' },
      { name: 'Payments', description: 'Payment management endpoints' },
      { name: 'Notifications', description: 'Notification management endpoints' },
      { name: 'Admin', description: 'Admin management endpoints' }
    ]
  },
  apis: [
    './src/services/*/routes/*.ts',
    './src/services/*/controllers/*.ts',
    './src/shared/utils/validation.ts'
  ]
};

const specs = swaggerJsdoc(options);

export { specs, swaggerUi };
