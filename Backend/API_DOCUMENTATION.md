# Hostel Management API Documentation

## Overview

The Hostel Management System provides a comprehensive REST API for managing hostel operations including student registration, room allocation, bookings, payments, and notifications.

## Accessing API Documentation

### Swagger UI
The interactive API documentation is available at:
- **Development**: http://localhost:3000/api/docs
- **Production**: https://your-domain.com/api/docs

### Features
- Interactive API explorer
- Request/response examples
- Authentication documentation
- Schema definitions
- Try-it-out functionality

## API Endpoints

### Authentication Service (Port 3001)
- `POST /auth/register` - Register a new user
- `POST /auth/login` - User login
- `GET /auth/profile` - Get current user profile
- `POST /auth/logout` - User logout

### Student Service (Port 3002)
- `POST /students` - Create student profile
- `GET /students/:id` - Get student by ID
- `PATCH /students/:id` - Update student profile
- `GET /students` - List students with pagination

### Hostel Service (Port 3003)
- `GET /hostels` - List all hostels
- `POST /hostels` - Create new hostel
- `GET /hostels/:id` - Get hostel by ID
- `GET /hostels/:id/rooms` - Get rooms in hostel

### Room Service (Port 3003)
- `GET /rooms` - List rooms
- `POST /rooms` - Create new room
- `GET /rooms/:id` - Get room by ID
- `PATCH /rooms/:id` - Update room

### Bed Service (Port 3003)
- `GET /beds` - List beds
- `POST /beds` - Create new bed
- `GET /beds/:id` - Get bed by ID
- `PATCH /beds/:id` - Update bed status

### Allocation Service (Port 3004)
- `POST /allocation/rank-beds` - Rank beds by seniority
- `POST /allocation/hold` - Hold a bed
- `POST /allocation/confirm` - Confirm allocation
- `POST /allocation/release` - Release bed hold

### Booking Service (Port 3006)
- `POST /bookings` - Create booking
- `GET /bookings/:id` - Get booking by ID
- `POST /bookings/:id/confirm` - Confirm booking
- `POST /bookings/:id/cancel` - Cancel booking
- `POST /bookings/:id/checkin` - Check in
- `POST /bookings/:id/checkout` - Check out

### Payment Service (Port 3007)
- `POST /payments/intents` - Create payment intent
- `GET /payments/intents/:id` - Get payment intent
- `POST /payments/webhook` - Payment webhook
- `POST /payments/refunds` - Process refund

### Notification Service (Port 3008)
- `POST /notifications` - Create notification
- `GET /notifications/:id` - Get notification
- `POST /notifications/:id/send` - Send notification
- `GET /notifications` - List notifications

### Admin Service (Port 3009)
- `GET /admin/dashboard` - Dashboard statistics
- `GET /admin/reports` - Generate reports
- `GET /admin/audit-logs` - View audit logs
- `POST /admin/overrides` - Create allocation override

## Authentication

Most endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Data Models

The API documentation includes detailed schema definitions for all data models:

- **User** - User account information
- **StudentProfile** - Student-specific data
- **Hostel** - Hostel information
- **Room** - Room details
- **Bed** - Bed availability and status
- **Booking** - Booking information
- **Payment** - Payment details
- **Notification** - Notification data

## Error Handling

All endpoints return consistent error responses:

```json
{
  "error": "Error message",
  "statusCode": 400
}
```

## Rate Limiting

API requests are rate-limited to 100 requests per 15 minutes per IP address.

## Getting Started

1. Start the gateway service: `npm run dev:gateway`
2. Access the documentation: http://localhost:3000/api/docs
3. Use the "Try it out" feature to test endpoints
4. Authenticate using the login endpoint to get a JWT token

## Development

To add new endpoints to the documentation:

1. Add JSDoc comments to your controller methods
2. Follow the OpenAPI 3.0 specification
3. Include request/response schemas
4. Add proper tags for organization

Example JSDoc comment:

```javascript
/**
 * @swagger
 * /your-endpoint:
 *   get:
 *     summary: Your endpoint description
 *     tags: [YourTag]
 *     responses:
 *       200:
 *         description: Success response
 */
```
