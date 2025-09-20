import { RouteDocument } from '../models/Route';

/**
 * Default route configurations for the API Gateway
 * This file contains all the route mappings for different microservices
 */
export const defaultRoutes: Record<string, any> = {
  // ==================== AUTH SERVICE ROUTES ====================
  'POST:/auth/register': {
    method: 'POST',
    path: '/auth/register',
    service: 'auth-service',
    targetUrl: 'http://localhost:3001',
    authentication: { required: false },
    rateLimit: { maxRequests: 10, windowMs: 900000 },
    caching: { enabled: false, ttl: 300 },
    timeout: 10000,
    transformation: { request: {}, response: {} },
    isActive: true
  },
  'POST:/auth/login': {
    method: 'POST',
    path: '/auth/login',
    service: 'auth-service',
    targetUrl: 'http://localhost:3001',
    authentication: { required: false },
    rateLimit: { maxRequests: 10, windowMs: 900000 },
    caching: { enabled: false, ttl: 300 },
    timeout: 50000,
    transformation: { request: {}, response: {} },
    isActive: true
  },
  'POST:/auth/signup': {
    method: 'POST',
    path: '/auth/signup',
    service: 'auth-service',
    targetUrl: 'http://localhost:3001',
    authentication: { required: false },
    rateLimit: { maxRequests: 10, windowMs: 900000 },
    caching: { enabled: false, ttl: 300 },
    timeout: 50000,
    transformation: { request: {}, response: {} },
    isActive: true
  },
  'GET:/auth/profile': {
    method: 'GET',
    path: '/auth/profile',
    service: 'auth-service',
    targetUrl: 'http://localhost:3001',
    authentication: { required: true },
    rateLimit: { maxRequests: 100, windowMs: 900000 },
    caching: { enabled: true, ttl: 300 },
    timeout: 50000,
    transformation: { request: {}, response: {} },
    isActive: true
  },
  'PUT:/auth/profile': {
    method: 'PUT',
    path: '/auth/profile',
    service: 'auth-service',
    targetUrl: 'http://localhost:3001',
    authentication: { required: true },
    rateLimit: { maxRequests: 20, windowMs: 900000 },
    caching: { enabled: false, ttl: 300 },
    timeout: 50000,
    transformation: { request: {}, response: {} },
    isActive: true
  },
  'POST:/auth/logout': {
    method: 'POST',
    path: '/auth/logout',
    service: 'auth-service',
    targetUrl: 'http://localhost:3001',
    authentication: { required: true },
    rateLimit: { maxRequests: 10, windowMs: 900000 },
    caching: { enabled: false, ttl: 300 },
    timeout: 50000,
    transformation: { request: {}, response: {} },
    isActive: true
  },
  'POST:/auth/verify-email-otp': {
    method: 'POST',
    path: '/auth/verify-email-otp',
    service: 'auth-service',
    targetUrl: 'http://localhost:3001',
    authentication: { required: false },
    rateLimit: { maxRequests: 10, windowMs: 900000 },
    caching: { enabled: false, ttl: 300 },
    timeout: 50000,
    transformation: { request: {}, response: {} },
    isActive: true
  },
  'POST:/auth/resend-email-otp': {
    method: 'POST',
    path: '/auth/resend-email-otp',
    service: 'auth-service',
    targetUrl: 'http://localhost:3001',
    authentication: { required: false },
    rateLimit: { maxRequests: 5, windowMs: 900000 },
    caching: { enabled: false, ttl: 300 },
    timeout: 50000,
    transformation: { request: {}, response: {} },
    isActive: true
  },
  'POST:/auth/forgot-password': {
    method: 'POST',
    path: '/auth/forgot-password',
    service: 'auth-service',
    targetUrl: 'http://localhost:3001',
    authentication: { required: false },
    rateLimit: { maxRequests: 5, windowMs: 900000 },
    caching: { enabled: false, ttl: 300 },
    timeout: 50000,
    transformation: { request: {}, response: {} },
    isActive: true
  },
  'POST:/auth/reset-password': {
    method: 'POST',
    path: '/auth/reset-password',
    service: 'auth-service',
    targetUrl: 'http://localhost:3001',
    authentication: { required: false },
    rateLimit: { maxRequests: 5, windowMs: 900000 },
    caching: { enabled: false, ttl: 300 },
    timeout: 50000,
    transformation: { request: {}, response: {} },
    isActive: true
  },
  'POST:/auth/change-password': {
    method: 'POST',
    path: '/auth/change-password',
    service: 'auth-service',
    targetUrl: 'http://localhost:3001',
    authentication: { required: true },
    rateLimit: { maxRequests: 10, windowMs: 900000 },
    caching: { enabled: false, ttl: 300 },
    timeout: 50000,
    transformation: { request: {}, response: {} },
    isActive: true
  },
  'POST:/auth/firebase/signup': {
    method: 'POST',
    path: '/auth/firebase/signup',
    service: 'auth-service',
    targetUrl: 'http://localhost:3001',
    authentication: { required: false },
    rateLimit: { maxRequests: 10, windowMs: 900000 },
    caching: { enabled: false, ttl: 300 },
    timeout: 50000,
    transformation: { request: {}, response: {} },
    isActive: true
  },
  'POST:/auth/firebase/login': {
    method: 'POST',
    path: '/auth/firebase/login',
    service: 'auth-service',
    targetUrl: 'http://localhost:3001',
    authentication: { required: false },
    rateLimit: { maxRequests: 10, windowMs: 900000 },
    caching: { enabled: false, ttl: 300 },
    timeout: 50000,
    transformation: { request: {}, response: {} },
    isActive: true
  },

  // ==================== STUDENT SERVICE ROUTES ====================
  'GET:/students': {
    method: 'GET',
    path: '/students',
    service: 'student-service',
    targetUrl: 'http://localhost:3002',
    authentication: { required: true },
    rateLimit: { maxRequests: 100, windowMs: 900000 },
    caching: { enabled: true, ttl: 300 },
    timeout: 50000,
    transformation: { request: {}, response: {} },
    isActive: true
  },
  'POST:/students': {
    method: 'POST',
    path: '/students',
    service: 'student-service',
    targetUrl: 'http://localhost:3002',
    authentication: { required: true },
    rateLimit: { maxRequests: 50, windowMs: 900000 },
    caching: { enabled: false, ttl: 300 },
    timeout: 50000,
    transformation: { request: {}, response: {} },
    isActive: true
  },
  'GET:/students/:id': {
    method: 'GET',
    path: '/students/:id',
    service: 'student-service',
    targetUrl: 'http://localhost:3002',
    authentication: { required: true },
    rateLimit: { maxRequests: 100, windowMs: 900000 },
    caching: { enabled: true, ttl: 300 },
    timeout: 50000,
    transformation: { request: {}, response: {} },
    isActive: true
  },
  'PATCH:/students/:id': {
    method: 'PATCH',
    path: '/students/:id',
    service: 'student-service',
    targetUrl: 'http://localhost:3002',
    authentication: { required: true },
    rateLimit: { maxRequests: 20, windowMs: 900000 },
    caching: { enabled: false, ttl: 300 },
    timeout: 50000,
    transformation: { request: {}, response: {} },
    isActive: true
  },
  'GET:/students/user/:userId': {
    method: 'GET',
    path: '/students/user/:userId',
    service: 'student-service',
    targetUrl: 'http://localhost:3002',
    authentication: { required: true },
    rateLimit: { maxRequests: 100, windowMs: 900000 },
    caching: { enabled: true, ttl: 300 },
    timeout: 50000,
    transformation: { request: {}, response: {} },
    isActive: true
  },
  'GET:/students/enrollment/:enrollmentNo': {
    method: 'GET',
    path: '/students/enrollment/:enrollmentNo',
    service: 'student-service',
    targetUrl: 'http://localhost:3002',
    authentication: { required: true },
    rateLimit: { maxRequests: 100, windowMs: 900000 },
    caching: { enabled: true, ttl: 300 },
    timeout: 50000,
    transformation: { request: {}, response: {} },
    isActive: true
  },
  'GET:/students/statistics': {
    method: 'GET',
    path: '/students/statistics',
    service: 'student-service',
    targetUrl: 'http://localhost:3002',
    authentication: { required: true, roles: ['ADMIN'] },
    rateLimit: { maxRequests: 50, windowMs: 900000 },
    caching: { enabled: true, ttl: 600 },
    timeout: 50000,
    transformation: { request: {}, response: {} },
    isActive: true
  },

  // ==================== HOSTEL SERVICE ROUTES ====================
  'GET:/hostels': {
    method: 'GET',
    path: '/hostels',
    service: 'hostel-service',
    targetUrl: 'http://localhost:3003',
    authentication: { required: false },
    rateLimit: { maxRequests: 100, windowMs: 900000 },
    caching: { enabled: true, ttl: 600 },
    timeout: 50000,
    transformation: { request: {}, response: {} },
    isActive: true
  },
  'POST:/hostels': {
    method: 'POST',
    path: '/hostels',
    service: 'hostel-service',
    targetUrl: 'http://localhost:3003',
    authentication: { required: true, roles: ['ADMIN', 'STAFF'] },
    rateLimit: { maxRequests: 20, windowMs: 900000 },
    caching: { enabled: false, ttl: 300 },
    timeout: 50000,
    transformation: { request: {}, response: {} },
    isActive: true
  },
  'GET:/hostels/:id': {
    method: 'GET',
    path: '/hostels/:id',
    service: 'hostel-service',
    targetUrl: 'http://localhost:3003',
    authentication: { required: false },
    rateLimit: { maxRequests: 100, windowMs: 900000 },
    caching: { enabled: true, ttl: 600 },
    timeout: 50000,
    transformation: { request: {}, response: {} },
    isActive: true
  },
  'PATCH:/hostels/:id': {
    method: 'PATCH',
    path: '/hostels/:id',
    service: 'hostel-service',
    targetUrl: 'http://localhost:3003',
    authentication: { required: true, roles: ['ADMIN', 'STAFF'] },
    rateLimit: { maxRequests: 20, windowMs: 900000 },
    caching: { enabled: false, ttl: 300 },
    timeout: 50000,
    transformation: { request: {}, response: {} },
    isActive: true
  },

  // ==================== BOOKING SERVICE ROUTES ====================
  'POST:/booking/bookings': {
    method: 'POST',
    path: '/booking/bookings',
    service: 'booking-service',
    targetUrl: 'http://localhost:3006',
    authentication: { required: true },
    rateLimit: { maxRequests: 20, windowMs: 900000 },
    caching: { enabled: false, ttl: 300 },
    timeout: 50000,
    transformation: { request: {}, response: {} },
    isActive: true
  },
  'GET:/booking/bookings': {
    method: 'GET',
    path: '/booking/bookings',
    service: 'booking-service',
    targetUrl: 'http://localhost:3006',
    authentication: { required: true },
    rateLimit: { maxRequests: 100, windowMs: 900000 },
    caching: { enabled: true, ttl: 300 },
    timeout: 50000,
    transformation: { request: {}, response: {} },
    isActive: true
  },
  'GET:/booking/bookings/:id': {
    method: 'GET',
    path: '/booking/bookings/:id',
    service: 'booking-service',
    targetUrl: 'http://localhost:3006',
    authentication: { required: true },
    rateLimit: { maxRequests: 100, windowMs: 900000 },
    caching: { enabled: true, ttl: 300 },
    timeout: 50000,
    transformation: { request: {}, response: {} },
    isActive: true
  },
  'PATCH:/booking/bookings/:id': {
    method: 'PATCH',
    path: '/booking/bookings/:id',
    service: 'booking-service',
    targetUrl: 'http://localhost:3006',
    authentication: { required: true },
    rateLimit: { maxRequests: 20, windowMs: 900000 },
    caching: { enabled: false, ttl: 300 },
    timeout: 50000,
    transformation: { request: {}, response: {} },
    isActive: true
  },
  'GET:/booking/bookings/student/:studentId': {
    method: 'GET',
    path: '/booking/bookings/student/:studentId',
    service: 'booking-service',
    targetUrl: 'http://localhost:3006',
    authentication: { required: true },
    rateLimit: { maxRequests: 100, windowMs: 900000 },
    caching: { enabled: true, ttl: 300 },
    timeout: 50000,
    transformation: { request: {}, response: {} },
    isActive: true
  },
  'GET:/booking/bookings/hostel/:hostelId': {
    method: 'GET',
    path: '/booking/bookings/hostel/:hostelId',
    service: 'booking-service',
    targetUrl: 'http://localhost:3006',
    authentication: { required: true },
    rateLimit: { maxRequests: 100, windowMs: 900000 },
    caching: { enabled: true, ttl: 300 },
    timeout: 50000,
    transformation: { request: {}, response: {} },
    isActive: true
  },

  // ==================== PAYMENT SERVICE ROUTES ====================
  'POST:/payment/payments': {
    method: 'POST',
    path: '/payment/payments',
    service: 'payment-service',
    targetUrl: 'http://localhost:3007',
    authentication: { required: true },
    rateLimit: { maxRequests: 50, windowMs: 900000 },
    caching: { enabled: false, ttl: 300 },
    timeout: 50000,
    transformation: { request: {}, response: {} },
    isActive: true
  },
  'GET:/payment/payments': {
    method: 'GET',
    path: '/payment/payments',
    service: 'payment-service',
    targetUrl: 'http://localhost:3007',
    authentication: { required: true },
    rateLimit: { maxRequests: 100, windowMs: 900000 },
    caching: { enabled: true, ttl: 300 },
    timeout: 50000,
    transformation: { request: {}, response: {} },
    isActive: true
  },
  'GET:/payment/payments/:id': {
    method: 'GET',
    path: '/payment/payments/:id',
    service: 'payment-service',
    targetUrl: 'http://localhost:3007',
    authentication: { required: true },
    rateLimit: { maxRequests: 100, windowMs: 900000 },
    caching: { enabled: true, ttl: 300 },
    timeout: 50000,
    transformation: { request: {}, response: {} },
    isActive: true
  },
  'PATCH:/payment/payments/:id': {
    method: 'PATCH',
    path: '/payment/payments/:id',
    service: 'payment-service',
    targetUrl: 'http://localhost:3007',
    authentication: { required: true },
    rateLimit: { maxRequests: 20, windowMs: 900000 },
    caching: { enabled: false, ttl: 300 },
    timeout: 50000,
    transformation: { request: {}, response: {} },
    isActive: true
  },
  'GET:/payment/payments/booking/:bookingId': {
    method: 'GET',
    path: '/payment/payments/booking/:bookingId',
    service: 'payment-service',
    targetUrl: 'http://localhost:3007',
    authentication: { required: true },
    rateLimit: { maxRequests: 100, windowMs: 900000 },
    caching: { enabled: true, ttl: 300 },
    timeout: 50000,
    transformation: { request: {}, response: {} },
    isActive: true
  },
  'GET:/payment/payments/student/:studentId': {
    method: 'GET',
    path: '/payment/payments/student/:studentId',
    service: 'payment-service',
    targetUrl: 'http://localhost:3007',
    authentication: { required: true },
    rateLimit: { maxRequests: 100, windowMs: 900000 },
    caching: { enabled: true, ttl: 300 },
    timeout: 50000,
    transformation: { request: {}, response: {} },
    isActive: true
  },
  'POST:/payment/webhooks/stripe': {
    method: 'POST',
    path: '/payment/webhooks/stripe',
    service: 'payment-service',
    targetUrl: 'http://localhost:3007',
    authentication: { required: false },
    rateLimit: { maxRequests: 1000, windowMs: 900000 },
    caching: { enabled: false, ttl: 300 },
    timeout: 50000,
    transformation: { request: {}, response: {} },
    isActive: true
  },

  // ==================== ALLOCATION SERVICE ROUTES ====================
  'GET:/allocation/requests': {
    method: 'GET',
    path: '/allocation/requests',
    service: 'allocation-service',
    targetUrl: 'http://localhost:3004',
    authentication: { required: true },
    rateLimit: { maxRequests: 100, windowMs: 900000 },
    caching: { enabled: true, ttl: 300 },
    timeout: 50000,
    transformation: { request: {}, response: {} },
    isActive: true
  },
  'POST:/allocation/requests': {
    method: 'POST',
    path: '/allocation/requests',
    service: 'allocation-service',
    targetUrl: 'http://localhost:3004',
    authentication: { required: true },
    rateLimit: { maxRequests: 20, windowMs: 900000 },
    caching: { enabled: false, ttl: 300 },
    timeout: 50000,
    transformation: { request: {}, response: {} },
    isActive: true
  },
  'GET:/allocation/requests/:id': {
    method: 'GET',
    path: '/allocation/requests/:id',
    service: 'allocation-service',
    targetUrl: 'http://localhost:3004',
    authentication: { required: true },
    rateLimit: { maxRequests: 100, windowMs: 900000 },
    caching: { enabled: true, ttl: 300 },
    timeout: 50000,
    transformation: { request: {}, response: {} },
    isActive: true
  },
  'PATCH:/allocation/requests/:id': {
    method: 'PATCH',
    path: '/allocation/requests/:id',
    service: 'allocation-service',
    targetUrl: 'http://localhost:3004',
    authentication: { required: true, roles: ['ADMIN', 'STAFF'] },
    rateLimit: { maxRequests: 20, windowMs: 900000 },
    caching: { enabled: false, ttl: 300 },
    timeout: 50000,
    transformation: { request: {}, response: {} },
    isActive: true
  },

  // ==================== PRICING SERVICE ROUTES ====================
  'GET:/pricing/plans': {
    method: 'GET',
    path: '/pricing/plans',
    service: 'pricing-service',
    targetUrl: 'http://localhost:3005',
    authentication: { required: false },
    rateLimit: { maxRequests: 100, windowMs: 900000 },
    caching: { enabled: true, ttl: 600 },
    timeout: 50000,
    transformation: { request: {}, response: {} },
    isActive: true
  },
  'POST:/pricing/plans': {
    method: 'POST',
    path: '/pricing/plans',
    service: 'pricing-service',
    targetUrl: 'http://localhost:3005',
    authentication: { required: true, roles: ['ADMIN'] },
    rateLimit: { maxRequests: 20, windowMs: 900000 },
    caching: { enabled: false, ttl: 300 },
    timeout: 50000,
    transformation: { request: {}, response: {} },
    isActive: true
  },
  'GET:/pricing/plans/:id': {
    method: 'GET',
    path: '/pricing/plans/:id',
    service: 'pricing-service',
    targetUrl: 'http://localhost:3005',
    authentication: { required: false },
    rateLimit: { maxRequests: 100, windowMs: 900000 },
    caching: { enabled: true, ttl: 600 },
    timeout: 50000,
    transformation: { request: {}, response: {} },
    isActive: true
  },
  'PATCH:/pricing/plans/:id': {
    method: 'PATCH',
    path: '/pricing/plans/:id',
    service: 'pricing-service',
    targetUrl: 'http://localhost:3005',
    authentication: { required: true, roles: ['ADMIN'] },
    rateLimit: { maxRequests: 20, windowMs: 900000 },
    caching: { enabled: false, ttl: 300 },
    timeout: 50000,
    transformation: { request: {}, response: {} },
    isActive: true
  },

  // ==================== NOTIFICATION SERVICE ROUTES ====================
  'GET:/notification/notifications': {
    method: 'GET',
    path: '/notification/notifications',
    service: 'notification-service',
    targetUrl: 'http://localhost:3008',
    authentication: { required: true },
    rateLimit: { maxRequests: 100, windowMs: 900000 },
    caching: { enabled: true, ttl: 300 },
    timeout: 50000,
    transformation: { request: {}, response: {} },
    isActive: true
  },
  'POST:/notification/notifications': {
    method: 'POST',
    path: '/notification/notifications',
    service: 'notification-service',
    targetUrl: 'http://localhost:3008',
    authentication: { required: true },
    rateLimit: { maxRequests: 50, windowMs: 900000 },
    caching: { enabled: false, ttl: 300 },
    timeout: 50000,
    transformation: { request: {}, response: {} },
    isActive: true
  },
  'GET:/notification/notifications/:id': {
    method: 'GET',
    path: '/notification/notifications/:id',
    service: 'notification-service',
    targetUrl: 'http://localhost:3008',
    authentication: { required: true },
    rateLimit: { maxRequests: 100, windowMs: 900000 },
    caching: { enabled: true, ttl: 300 },
    timeout: 50000,
    transformation: { request: {}, response: {} },
    isActive: true
  },
  'PATCH:/notification/notifications/:id': {
    method: 'PATCH',
    path: '/notification/notifications/:id',
    service: 'notification-service',
    targetUrl: 'http://localhost:3008',
    authentication: { required: true },
    rateLimit: { maxRequests: 20, windowMs: 900000 },
    caching: { enabled: false, ttl: 300 },
    timeout: 50000,
    transformation: { request: {}, response: {} },
    isActive: true
  },

  // ==================== ADMIN SERVICE ROUTES ====================
  // Admin Management Routes
  'POST:/admin': {
    method: 'POST',
    path: '/admin',
    service: 'admin-service',
    targetUrl: 'http://localhost:3009/api/admin',
    authentication: { required: true, roles: ['ADMIN'] },
    rateLimit: { maxRequests: 20, windowMs: 900000 },
    caching: { enabled: false, ttl: 300 },
    timeout: 50000,
    transformation: { request: {}, response: {} },
    isActive: true
  },
  'GET:/admin/search': {
    method: 'GET',
    path: '/admin/search',
    service: 'admin-service',
    targetUrl: 'http://localhost:3009/api/admin/search',
    authentication: { required: true, roles: ['ADMIN'] },
    rateLimit: { maxRequests: 100, windowMs: 900000 },
    caching: { enabled: true, ttl: 300 },
    timeout: 50000,
    transformation: { request: {}, response: {} },
    isActive: true
  },
  'GET:/admin/:id': {
    method: 'GET',
    path: '/admin/:id',
    service: 'admin-service',
    targetUrl: 'http://localhost:3009/api/admin/:id',
    authentication: { required: true, roles: ['ADMIN'] },
    rateLimit: { maxRequests: 100, windowMs: 900000 },
    caching: { enabled: true, ttl: 300 },
    timeout: 50000,
    transformation: { request: {}, response: {} },
    isActive: true
  },
  'PUT:/admin/:id': {
    method: 'PUT',
    path: '/admin/:id',
    service: 'admin-service',
    targetUrl: 'http://localhost:3009/api/admin/:id',
    authentication: { required: true, roles: ['ADMIN'] },
    rateLimit: { maxRequests: 20, windowMs: 900000 },
    caching: { enabled: false, ttl: 300 },
    timeout: 50000,
    transformation: { request: {}, response: {} },
    isActive: true
  },
  'DELETE:/admin/:id': {
    method: 'DELETE',
    path: '/admin/:id',
    service: 'admin-service',
    targetUrl: 'http://localhost:3009/api/admin/:id',
    authentication: { required: true, roles: ['ADMIN'] },
    rateLimit: { maxRequests: 20, windowMs: 900000 },
    caching: { enabled: false, ttl: 300 },
    timeout: 50000,
    transformation: { request: {}, response: {} },
    isActive: true
  },
  'GET:/admin': {
    method: 'GET',
    path: '/admin',
    service: 'admin-service',
    targetUrl: 'http://localhost:3009/api/admin',
    authentication: { required: true, roles: ['ADMIN'] },
    rateLimit: { maxRequests: 100, windowMs: 900000 },
    caching: { enabled: true, ttl: 300 },
    timeout: 50000,
    transformation: { request: {}, response: {} },
    isActive: true
  },

  // Report Management Routes
  'POST:/admin/reports': {
    method: 'POST',
    path: '/admin/reports',
    service: 'admin-service',
    targetUrl: 'http://localhost:3009/api/admin/reports',
    authentication: { required: true, roles: ['ADMIN'] },
    rateLimit: { maxRequests: 20, windowMs: 900000 },
    caching: { enabled: false, ttl: 300 },
    timeout: 50000,
    transformation: { request: {}, response: {} },
    isActive: true
  },
  'GET:/admin/reports/:id': {
    method: 'GET',
    path: '/admin/reports/:id',
    service: 'admin-service',
    targetUrl: 'http://localhost:3009/api/admin/reports/:id',
    authentication: { required: true, roles: ['ADMIN'] },
    rateLimit: { maxRequests: 100, windowMs: 900000 },
    caching: { enabled: true, ttl: 300 },
    timeout: 50000,
    transformation: { request: {}, response: {} },
    isActive: true
  },
  'PUT:/admin/reports/:id': {
    method: 'PUT',
    path: '/admin/reports/:id',
    service: 'admin-service',
    targetUrl: 'http://localhost:3009/api/admin/reports/:id',
    authentication: { required: true, roles: ['ADMIN'] },
    rateLimit: { maxRequests: 20, windowMs: 900000 },
    caching: { enabled: false, ttl: 300 },
    timeout: 50000,
    transformation: { request: {}, response: {} },
    isActive: true
  },
  'DELETE:/admin/reports/:id': {
    method: 'DELETE',
    path: '/admin/reports/:id',
    service: 'admin-service',
    targetUrl: 'http://localhost:3009/api/admin/reports/:id',
    authentication: { required: true, roles: ['ADMIN'] },
    rateLimit: { maxRequests: 20, windowMs: 900000 },
    caching: { enabled: false, ttl: 300 },
    timeout: 50000,
    transformation: { request: {}, response: {} },
    isActive: true
  },
  'GET:/admin/reports': {
    method: 'GET',
    path: '/admin/reports',
    service: 'admin-service',
    targetUrl: 'http://localhost:3009/api/admin/reports',
    authentication: { required: true, roles: ['ADMIN'] },
    rateLimit: { maxRequests: 100, windowMs: 900000 },
    caching: { enabled: true, ttl: 300 },
    timeout: 50000,
    transformation: { request: {}, response: {} },
    isActive: true
  },

  // Audit Log Management Routes
  'POST:/admin/audit-logs': {
    method: 'POST',
    path: '/admin/audit-logs',
    service: 'admin-service',
    targetUrl: 'http://localhost:3009/api/admin/audit-logs',
    authentication: { required: true, roles: ['ADMIN'] },
    rateLimit: { maxRequests: 20, windowMs: 900000 },
    caching: { enabled: false, ttl: 300 },
    timeout: 50000,
    transformation: { request: {}, response: {} },
    isActive: true
  },
  'GET:/admin/audit-logs/:id': {
    method: 'GET',
    path: '/admin/audit-logs/:id',
    service: 'admin-service',
    targetUrl: 'http://localhost:3009/api/admin/audit-logs/:id',
    authentication: { required: true, roles: ['ADMIN'] },
    rateLimit: { maxRequests: 100, windowMs: 900000 },
    caching: { enabled: true, ttl: 300 },
    timeout: 50000,
    transformation: { request: {}, response: {} },
    isActive: true
  },
  'GET:/admin/audit-logs': {
    method: 'GET',
    path: '/admin/audit-logs',
    service: 'admin-service',
    targetUrl: 'http://localhost:3009/api/admin/audit-logs',
    authentication: { required: true, roles: ['ADMIN'] },
    rateLimit: { maxRequests: 100, windowMs: 900000 },
    caching: { enabled: true, ttl: 300 },
    timeout: 50000,
    transformation: { request: {}, response: {} },
    isActive: true
  },

  // User Management Routes
  'GET:/admin/users': {
    method: 'GET',
    path: '/admin/users',
    service: 'admin-service',
    targetUrl: 'http://localhost:3009/api/admin/users',
    authentication: { required: true, roles: ['ADMIN'] },
    rateLimit: { maxRequests: 100, windowMs: 900000 },
    caching: { enabled: true, ttl: 300 },
    timeout: 50000,
    transformation: { request: {}, response: {} },
    isActive: true
  },
  'POST:/admin/users': {
    method: 'POST',
    path: '/admin/users',
    service: 'admin-service',
    targetUrl: 'http://localhost:3009/api/admin/users',
    authentication: { required: true, roles: ['ADMIN'] },
    rateLimit: { maxRequests: 20, windowMs: 900000 },
    caching: { enabled: false, ttl: 300 },
    timeout: 50000,
    transformation: { request: {}, response: {} },
    isActive: true
  },
  'GET:/admin/users/:id': {
    method: 'GET',
    path: '/admin/users/:id',
    service: 'admin-service',
    targetUrl: 'http://localhost:3009/api/admin/users/:id',
    authentication: { required: true, roles: ['ADMIN'] },
    rateLimit: { maxRequests: 100, windowMs: 900000 },
    caching: { enabled: true, ttl: 300 },
    timeout: 50000,
    transformation: { request: {}, response: {} },
    isActive: true
  },
  'PATCH:/admin/users/:id/role': {
    method: 'PATCH',
    path: '/admin/users/:id/role',
    service: 'admin-service',
    targetUrl: 'http://localhost:3009/api/admin/users/:id/role',
    authentication: { required: true, roles: ['ADMIN'] },
    rateLimit: { maxRequests: 20, windowMs: 900000 },
    caching: { enabled: false, ttl: 300 },
    timeout: 50000,
    transformation: { request: {}, response: {} },
    isActive: true
  },
  'PATCH:/admin/users/:id/status': {
    method: 'PATCH',
    path: '/admin/users/:id/status',
    service: 'admin-service',
    targetUrl: 'http://localhost:3009/api/admin/users/:id/status',
    authentication: { required: true, roles: ['ADMIN'] },
    rateLimit: { maxRequests: 20, windowMs: 900000 },
    caching: { enabled: false, ttl: 300 },
    timeout: 50000,
    transformation: { request: {}, response: {} },
    isActive: true
  },
  'PATCH:/admin/users/bulk-roles': {
    method: 'PATCH',
    path: '/admin/users/bulk-roles',
    service: 'admin-service',
    targetUrl: 'http://localhost:3009/api/admin/users/bulk-roles',
    authentication: { required: true, roles: ['ADMIN'] },
    rateLimit: { maxRequests: 20, windowMs: 900000 },
    caching: { enabled: false, ttl: 300 },
    timeout: 50000,
    transformation: { request: {}, response: {} },
    isActive: true
  },
  'DELETE:/admin/users/:id': {
    method: 'DELETE',
    path: '/admin/users/:id',
    service: 'admin-service',
    targetUrl: 'http://localhost:3009/api/admin/users/:id',
    authentication: { required: true, roles: ['ADMIN'] },
    rateLimit: { maxRequests: 20, windowMs: 900000 },
    caching: { enabled: false, ttl: 300 },
    timeout: 50000,
    transformation: { request: {}, response: {} },
    isActive: true
  },

  // Dashboard Routes
  'GET:/admin/dashboard': {
    method: 'GET',
    path: '/admin/dashboard',
    service: 'admin-service',
    targetUrl: 'http://localhost:3009',
    authentication: { required: true, roles: ['ADMIN'] },
    rateLimit: { maxRequests: 100, windowMs: 900000 },
    caching: { enabled: true, ttl: 300 },
    timeout: 50000,
    transformation: { request: {}, response: {} },
    isActive: true
  },
  'GET:/admin/dashboard/stats': {
    method: 'GET',
    path: '/admin/dashboard/stats',
    service: 'admin-service',
    targetUrl: 'http://localhost:3009',
    authentication: { required: true, roles: ['ADMIN'] },
    rateLimit: { maxRequests: 100, windowMs: 900000 },
    caching: { enabled: true, ttl: 300 },
    timeout: 50000,
    transformation: { request: {}, response: {} },
    isActive: true
  },

  // Staff Management Routes
  'GET:/admin/staff': {
    method: 'GET',
    path: '/admin/staff',
    service: 'admin-service',
    targetUrl: 'http://localhost:3009/api/admin/staff',
    authentication: { required: true, roles: ['ADMIN'] },
    rateLimit: { maxRequests: 100, windowMs: 900000 },
    caching: { enabled: true, ttl: 300 },
    timeout: 50000,
    transformation: { request: {}, response: {} },
    isActive: true
  },
  'POST:/admin/staff': {
    method: 'POST',
    path: '/admin/staff',
    service: 'admin-service',
    targetUrl: 'http://localhost:3009/api/admin/staff',
    authentication: { required: true, roles: ['ADMIN'] },
    rateLimit: { maxRequests: 20, windowMs: 900000 },
    caching: { enabled: false, ttl: 300 },
    timeout: 50000,
    transformation: { request: {}, response: {} },
    isActive: true
  },
  'GET:/admin/staff/:id': {
    method: 'GET',
    path: '/admin/staff/:id',
    service: 'admin-service',
    targetUrl: 'http://localhost:3009/api/admin/staff/:id',
    authentication: { required: true, roles: ['ADMIN'] },
    rateLimit: { maxRequests: 100, windowMs: 900000 },
    caching: { enabled: true, ttl: 300 },
    timeout: 50000,
    transformation: { request: {}, response: {} },
    isActive: true
  },
  'PATCH:/admin/staff/:id': {
    method: 'PATCH',
    path: '/admin/staff/:id',
    service: 'admin-service',
    targetUrl: 'http://localhost:3009/api/admin/staff/:id',
    authentication: { required: true, roles: ['ADMIN'] },
    rateLimit: { maxRequests: 20, windowMs: 900000 },
    caching: { enabled: false, ttl: 300 },
    timeout: 50000,
    transformation: { request: {}, response: {} },
    isActive: true
  },
  'PATCH:/admin/staff/:id/status': {
    method: 'PATCH',
    path: '/admin/staff/:id/status',
    service: 'admin-service',
    targetUrl: 'http://localhost:3009/api/admin/staff/:id/status',
    authentication: { required: true, roles: ['ADMIN'] },
    rateLimit: { maxRequests: 20, windowMs: 900000 },
    caching: { enabled: false, ttl: 300 },
    timeout: 50000,
    transformation: { request: {}, response: {} },
    isActive: true
  },
  'PATCH:/admin/staff/:id/permissions': {
    method: 'PATCH',
    path: '/admin/staff/:id/permissions',
    service: 'admin-service',
    targetUrl: 'http://localhost:3009/api/admin/staff/:id/permissions',
    authentication: { required: true, roles: ['ADMIN'] },
    rateLimit: { maxRequests: 20, windowMs: 900000 },
    caching: { enabled: false, ttl: 300 },
    timeout: 50000,
    transformation: { request: {}, response: {} },
    isActive: true
  },
  'DELETE:/admin/staff/:id': {
    method: 'DELETE',
    path: '/admin/staff/:id',
    service: 'admin-service',
    targetUrl: 'http://localhost:3009/api/admin/staff/:id',
    authentication: { required: true, roles: ['ADMIN'] },
    rateLimit: { maxRequests: 20, windowMs: 900000 },
    caching: { enabled: false, ttl: 300 },
    timeout: 50000,
    transformation: { request: {}, response: {} },
    isActive: true
  },
  'GET:/admin/staff/employee/:employeeId': {
    method: 'GET',
    path: '/admin/staff/employee/:employeeId',
    service: 'admin-service',
    targetUrl: 'http://localhost:3009/api/admin/staff/employee/:employeeId',
    authentication: { required: true, roles: ['ADMIN'] },
    rateLimit: { maxRequests: 100, windowMs: 900000 },
    caching: { enabled: true, ttl: 300 },
    timeout: 50000,
    transformation: { request: {}, response: {} },
    isActive: true
  },

  // Student Management Routes
  'GET:/admin/students': {
    method: 'GET',
    path: '/admin/students',
    service: 'admin-service',
    targetUrl: 'http://localhost:3009/api/admin/students',
    authentication: { required: true, roles: ['ADMIN'] },
    rateLimit: { maxRequests: 100, windowMs: 900000 },
    caching: { enabled: true, ttl: 300 },
    timeout: 50000,
    transformation: { request: {}, response: {} },
    isActive: true
  },
  'POST:/admin/students': {
    method: 'POST',
    path: '/admin/students',
    service: 'admin-service',
    targetUrl: 'http://localhost:3009/api/admin/students',
    authentication: { required: true, roles: ['ADMIN'] },
    rateLimit: { maxRequests: 20, windowMs: 900000 },
    caching: { enabled: false, ttl: 300 },
    timeout: 50000,
    transformation: { request: {}, response: {} },
    isActive: true
  },
  'GET:/admin/students/:id': {
    method: 'GET',
    path: '/admin/students/:id',
    service: 'admin-service',
    targetUrl: 'http://localhost:3009/api/admin/students/:id',
    authentication: { required: true, roles: ['ADMIN'] },
    rateLimit: { maxRequests: 100, windowMs: 900000 },
    caching: { enabled: true, ttl: 300 },
    timeout: 50000,
    transformation: { request: {}, response: {} },
    isActive: true
  },
  'PATCH:/admin/students/:id': {
    method: 'PATCH',
    path: '/admin/students/:id',
    service: 'admin-service',
    targetUrl: 'http://localhost:3009/api/admin/students/:id',
    authentication: { required: true, roles: ['ADMIN'] },
    rateLimit: { maxRequests: 20, windowMs: 900000 },
    caching: { enabled: false, ttl: 300 },
    timeout: 50000,
    transformation: { request: {}, response: {} },
    isActive: true
  },
  'PATCH:/admin/students/:id/status': {
    method: 'PATCH',
    path: '/admin/students/:id/status',
    service: 'admin-service',
    targetUrl: 'http://localhost:3009/api/admin/students/:id/status',
    authentication: { required: true, roles: ['ADMIN'] },
    rateLimit: { maxRequests: 20, windowMs: 900000 },
    caching: { enabled: false, ttl: 300 },
    timeout: 50000,
    transformation: { request: {}, response: {} },
    isActive: true
  },
  'DELETE:/admin/students/:id': {
    method: 'DELETE',
    path: '/admin/students/:id',
    service: 'admin-service',
    targetUrl: 'http://localhost:3009/api/admin/students/:id',
    authentication: { required: true, roles: ['ADMIN'] },
    rateLimit: { maxRequests: 20, windowMs: 900000 },
    caching: { enabled: false, ttl: 300 },
    timeout: 50000,
    transformation: { request: {}, response: {} },
    isActive: true
  },
  'GET:/admin/students/enrollment/:enrollmentNo': {
    method: 'GET',
    path: '/admin/students/enrollment/:enrollmentNo',
    service: 'admin-service',
    targetUrl: 'http://localhost:3009/api/admin/students/enrollment/:enrollmentNo',
    authentication: { required: true, roles: ['ADMIN'] },
    rateLimit: { maxRequests: 100, windowMs: 900000 },
    caching: { enabled: true, ttl: 300 },
    timeout: 50000,
    transformation: { request: {}, response: {} },
    isActive: true
  },

  // ==================== TEST ROUTES ====================
  'POST:/test': {
    method: 'POST',
    path: '/test',
    service: 'test-service',
    targetUrl: 'http://localhost:3010',
    authentication: { required: false },
    rateLimit: { maxRequests: 100, windowMs: 900000 },
    caching: { enabled: false, ttl: 300 },
    timeout: 50000,
    transformation: { request: {}, response: {} },
    isActive: true
  }
};

/**
 * Get route configuration by method and path
 */
export const getRouteConfig = (method: string, path: string): any => {
  const routeKey = `${method.toUpperCase()}:${path}`;
  return defaultRoutes[routeKey] || null;
};

/**
 * Get all available routes
 */
export const getAllRoutes = (): Record<string, any> => {
  return defaultRoutes;
};

/**
 * Check if a route exists
 */
export const routeExists = (method: string, path: string): boolean => {
  const routeKey = `${method.toUpperCase()}:${path}`;
  return routeKey in defaultRoutes;
};
