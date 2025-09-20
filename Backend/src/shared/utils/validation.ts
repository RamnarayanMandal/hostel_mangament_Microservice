import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';

// Common validation schemas
export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().optional(),
});

export const idParamSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format'),
});

// User validation schemas
export const createUserSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  firstName: z.string().min(2, 'First name must be at least 2 characters').optional(),
  lastName: z.string().min(2, 'Last name must be at least 2 characters').optional(),
  phone: z.string().optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  role: z.enum(['STUDENT', 'ADMIN', 'STAFF']).default('STUDENT'),
});

export const signupSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
  phoneNumber: z.string().regex(/^[6-9]\d{9}$/, 'Phone number must be 10 digits starting with 6-9'),
  gender: z.enum(['male', 'female', 'other']),
  role: z.enum(['STUDENT', 'ADMIN', 'STAFF']).default('STUDENT'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

export const verifyOTPSchema = z.object({
  otp: z.string().length(6, 'OTP must be 6 digits').regex(/^\d{6}$/, 'OTP must contain only numbers'),
  email: z.string().email('Invalid email format'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email format'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

export const updateProfileSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters').optional(),
  lastName: z.string().min(2, 'Last name must be at least 2 characters').optional(),
  phoneNumber: z.string().regex(/^[6-9]\d{9}$/, 'Phone number must be 10 digits starting with 6-9').optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
});

export const firebaseAuthSchema = z.object({
  idToken: z.string().min(1, 'Firebase ID token is required'),
});

export const updateUserSchema = z.object({
  fullName: z.string().min(2).optional(),
  phone: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

// Student validation schemas
export const createStudentSchema = z.object({
  userId: z.string().regex(/^[0-9a-fA-F]{24}$/),
  enrollmentNo: z.string().min(1, 'Enrollment number is required'),
  program: z.string().optional(),
  year: z.number().min(1).max(10),
  semester: z.number().min(1).max(10).optional(),
  category: z.enum(['GEN', 'OBC', 'SC', 'ST', 'EWS']).optional(),
  domicileState: z.string().optional(),
  kycStatus: z.enum(['PENDING', 'VERIFIED', 'REJECTED']).default('PENDING'),
});

export const updateStudentSchema = z.object({
  program: z.string().optional(),
  year: z.number().min(1).max(10).optional(),
  semester: z.number().min(1).max(10).optional(),
  category: z.enum(['GEN', 'OBC', 'SC', 'ST', 'EWS']).optional(),
  domicileState: z.string().optional(),
  kycStatus: z.enum(['PENDING', 'VERIFIED', 'REJECTED']).optional(),
});

// Hostel validation schemas
export const createHostelSchema = z.object({
  name: z.string().min(2, 'Hostel name must be at least 2 characters'),
  campus: z.string().min(1, 'Campus is required'),
  address: z.string().min(10, 'Address must be at least 10 characters'),
  amenities: z.array(z.string()).default([]),
  contactInfo: z.object({
    phone: z.string().min(10, 'Phone number must be at least 10 digits'),
    email: z.string().email('Invalid email format'),
  }),
  capacity: z.number().min(1, 'Capacity must be at least 1'),
  description: z.string().optional(),
});

export const updateHostelSchema = z.object({
  name: z.string().min(2).optional(),
  campus: z.string().optional(),
  address: z.string().min(10).optional(),
  amenities: z.array(z.string()).optional(),
  contactInfo: z.object({
    phone: z.string().min(10).optional(),
    email: z.string().email().optional(),
  }).optional(),
  capacity: z.number().min(1).optional(),
  isActive: z.boolean().optional(),
});

// Room validation schemas
export const createRoomSchema = z.object({
  hostelId: z.string().regex(/^[0-9a-fA-F]{24}$/),
  number: z.string().min(1, 'Room number is required'),
  type: z.enum(['SINGLE', 'DOUBLE', 'TRIPLE', 'DORM']),
  genderPolicy: z.enum(['MALE', 'FEMALE', 'ANY']).optional(),
  priceTier: z.string().optional(),
  floor: z.number().min(0),
  block: z.string().optional(),
});

export const updateRoomSchema = z.object({
  number: z.string().min(1).optional(),
  type: z.enum(['SINGLE', 'DOUBLE', 'TRIPLE', 'DORM']).optional(),
  genderPolicy: z.enum(['MALE', 'FEMALE', 'ANY']).optional(),
  priceTier: z.string().optional(),
  status: z.enum(['OPEN', 'MAINTENANCE', 'BLOCKED']).optional(),
  floor: z.number().min(0).optional(),
  block: z.string().optional(),
});

// Bed validation schemas
export const createBedSchema = z.object({
  roomId: z.string().regex(/^[0-9a-fA-F]{24}$/),
  bedNo: z.string().min(1, 'Bed number is required'),
});

export const updateBedSchema = z.object({
  bedNo: z.string().min(1).optional(),
  status: z.enum(['AVAILABLE', 'ON_HOLD', 'ALLOCATED', 'BLOCKED']).optional(),
});

// Booking validation schemas
export const createBookingSchema = z.object({
  studentId: z.string().regex(/^[0-9a-fA-F]{24}$/),
  hostelId: z.string().regex(/^[0-9a-fA-F]{24}$/),
  roomId: z.string().regex(/^[0-9a-fA-F]{24}$/),
  bedId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
});

export const updateBookingSchema = z.object({
  status: z.enum(['HOLD', 'PENDING_PAYMENT', 'CONFIRMED', 'CANCELLED', 'CHECKED_IN', 'CHECKED_OUT']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

// Payment validation schemas
export const createPaymentIntentSchema = z.object({
  bookingId: z.string().regex(/^[0-9a-fA-F]{24}$/),
  amount: z.number().positive('Amount must be positive'),
  currency: z.enum(['INR', 'USD']).default('INR'),
  provider: z.enum(['RAZORPAY', 'STRIPE']),
});

export const refundSchema = z.object({
  paymentIntentId: z.string().regex(/^[0-9a-fA-F]{24}$/),
  amount: z.number().positive('Amount must be positive'),
  reason: z.string().min(1, 'Refund reason is required'),
});

// Fee policy validation schemas
export const createFeePolicySchema = z.object({
  hostelId: z.string().regex(/^[0-9a-fA-F]{24}$/),
  roomType: z.enum(['SINGLE', 'DOUBLE', 'TRIPLE', 'DORM']),
  baseMonthlyFee: z.number().positive('Base fee must be positive'),
  currency: z.enum(['INR', 'USD']).default('INR'),
  effectiveFrom: z.string().datetime(),
  effectiveTo: z.string().datetime().optional(),
  adjustments: z.array(z.object({
    type: z.enum(['CATEGORY_CONCESSION', 'SCHOLARSHIP', 'SURCHARGE']),
    match: z.object({
      category: z.string().optional(),
      year: z.number().optional(),
      domicileState: z.string().optional(),
    }),
    value: z.object({
      kind: z.enum(['PERCENT', 'FLAT']),
      amount: z.number(),
    }),
  })).optional(),
});

export const updateFeePolicySchema = z.object({
  roomType: z.enum(['SINGLE', 'DOUBLE', 'TRIPLE', 'DORM']).optional(),
  baseMonthlyFee: z.number().positive('Base fee must be positive').optional(),
  currency: z.enum(['INR', 'USD']).optional(),
  effectiveFrom: z.string().datetime().optional(),
  effectiveTo: z.string().datetime().optional(),
  adjustments: z.array(z.object({
    type: z.enum(['CATEGORY_CONCESSION', 'SCHOLARSHIP', 'SURCHARGE']),
    match: z.object({
      category: z.string().optional(),
      year: z.number().optional(),
      domicileState: z.string().optional(),
    }),
    value: z.object({
      kind: z.enum(['PERCENT', 'FLAT']),
      amount: z.number(),
    }),
  })).optional(),
});

// Allocation rule validation schemas
export const createAllocationRuleSchema = z.object({
  name: z.string().min(2, 'Rule name must be at least 2 characters'),
  description: z.string().max(500).optional(),
  priority: z.number().min(1, 'Priority must be at least 1'),
  isActive: z.boolean().default(true),
  criteria: z.object({
    yearRange: z.object({
      min: z.number().min(1),
      max: z.number().min(1)
    }).optional(),
    categories: z.array(z.enum(['GEN', 'OBC', 'SC', 'ST', 'EWS'])).optional(),
    domicileStates: z.array(z.string()).optional(),
    programs: z.array(z.string()).optional(),
    seniorityScoreRange: z.object({
      min: z.number().min(0),
      max: z.number().min(0)
    }).optional(),
    kycStatus: z.array(z.enum(['PENDING', 'VERIFIED', 'REJECTED'])).optional()
  }).optional(),
  allocation: z.object({
    hostelIds: z.array(z.string()),
    roomTypes: z.array(z.enum(['SINGLE', 'DOUBLE', 'TRIPLE', 'DORM'])),
    genderPolicy: z.enum(['MALE', 'FEMALE', 'ANY']),
    maxStudentsPerRoom: z.number().min(1),
    allocationMethod: z.enum(['FIRST_COME_FIRST_SERVE', 'LOTTERY', 'MERIT_BASED', 'SENIORITY_BASED']).default('SENIORITY_BASED')
  }),
  constraints: z.object({
    maxDuration: z.number().min(1),
    allowTransfers: z.boolean().default(true),
    allowExtensions: z.boolean().default(true),
    requireParentalConsent: z.boolean().default(false),
    requireMedicalCertificate: z.boolean().default(false)
  }).optional(),
  quotas: z.object({
    totalSeats: z.number().min(0),
    reservedSeats: z.number().min(0).default(0),
    waitlistCapacity: z.number().min(0).default(0)
  }),
  schedule: z.object({
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
    applicationDeadline: z.string().datetime(),
    allocationStartDate: z.string().datetime(),
    allocationEndDate: z.string().datetime()
  })
});

export const updateAllocationRuleSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().max(500).optional(),
  priority: z.number().min(1).max(100).optional(),
  isActive: z.boolean().optional(),
  criteria: z.object({
    yearRange: z.object({
      min: z.number().min(1),
      max: z.number().min(1)
    }).optional(),
    categories: z.array(z.enum(['GEN', 'OBC', 'SC', 'ST', 'EWS'])).optional(),
    domicileStates: z.array(z.string()).optional(),
    programs: z.array(z.string()).optional(),
    seniorityScoreRange: z.object({
      min: z.number().min(0),
      max: z.number().min(0)
    }).optional(),
    kycStatus: z.array(z.enum(['PENDING', 'VERIFIED', 'REJECTED'])).optional()
  }).optional(),
  allocation: z.object({
    hostelIds: z.array(z.string()).optional(),
    roomTypes: z.array(z.enum(['SINGLE', 'DOUBLE', 'TRIPLE', 'DORM'])).optional(),
    genderPolicy: z.enum(['MALE', 'FEMALE', 'ANY']).optional(),
    maxStudentsPerRoom: z.number().min(1).optional(),
    allocationMethod: z.enum(['FIRST_COME_FIRST_SERVE', 'LOTTERY', 'MERIT_BASED', 'SENIORITY_BASED']).optional()
  }).optional(),
  constraints: z.object({
    maxDuration: z.number().min(1).optional(),
    allowTransfers: z.boolean().optional(),
    allowExtensions: z.boolean().optional(),
    requireParentalConsent: z.boolean().optional(),
    requireMedicalCertificate: z.boolean().optional()
  }).optional(),
  quotas: z.object({
    totalSeats: z.number().min(0).optional(),
    reservedSeats: z.number().min(0).optional(),
    waitlistCapacity: z.number().min(0).optional()
  }).optional(),
  schedule: z.object({
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    applicationDeadline: z.string().datetime().optional(),
    allocationStartDate: z.string().datetime().optional(),
    allocationEndDate: z.string().datetime().optional()
  }).optional()
});

// Allocation Request Schemas
export const createAllocationRequestSchema = z.object({
  allocationRuleId: z.string(),
  preferences: z.object({
    hostelIds: z.array(z.string()).optional(),
    roomTypes: z.array(z.enum(['SINGLE', 'DOUBLE', 'TRIPLE', 'DORM'])).optional(),
    roommatePreferences: z.array(z.string()).optional(),
    specialRequirements: z.array(z.string()).optional()
  }).optional(),
  documents: z.array(z.object({
    type: z.string(),
    url: z.string()
  })).optional()
});

export const updateAllocationRequestSchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'WAITLISTED', 'ALLOCATED', 'CANCELLED']).optional(),
  priority: z.number().optional(),
  preferences: z.object({
    hostelIds: z.array(z.string()).optional(),
    roomTypes: z.array(z.enum(['SINGLE', 'DOUBLE', 'TRIPLE', 'DORM'])).optional(),
    roommatePreferences: z.array(z.string()).optional(),
    specialRequirements: z.array(z.string()).optional()
  }).optional(),
  allocation: z.object({
    hostelId: z.string().optional(),
    roomId: z.string().optional(),
    bedId: z.string().optional()
  }).optional(),
  review: z.object({
    comments: z.string().optional(),
    rejectionReason: z.string().optional()
  }).optional()
});// Notification validation schemas
export const createNotificationSchema = z.object({
  type: z.enum(['EMAIL', 'SMS', 'PUSH', 'IN_APP', 'WHATSAPP']),
  category: z.enum(['BOOKING', 'PAYMENT', 'ALLOCATION', 'SYSTEM', 'REMINDER', 'ALERT']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  recipient: z.object({
    userId: z.string().optional(),
    studentId: z.string().optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    deviceToken: z.string().optional()
  }),
  content: z.object({
    subject: z.string().optional(),
    title: z.string().optional(),
    message: z.string().min(1, 'Message is required'),
    template: z.string().optional(),
    templateData: z.any().optional(),
    attachments: z.array(z.object({
      fileName: z.string(),
      fileUrl: z.string(),
      mimeType: z.string()
    })).optional()
  }),
  metadata: z.object({
    source: z.string().default('SYSTEM'),
    eventType: z.string().optional(),
    eventId: z.string().optional(),
    correlationId: z.string().optional()
  }).optional()
});

export const updateNotificationSchema = z.object({
  type: z.enum(['EMAIL', 'SMS', 'PUSH', 'IN_APP', 'WHATSAPP']).optional(),
  category: z.enum(['BOOKING', 'PAYMENT', 'ALLOCATION', 'SYSTEM', 'REMINDER', 'ALERT']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  status: z.enum(['PENDING', 'SENT', 'DELIVERED', 'FAILED', 'CANCELLED']).optional(),
  recipient: z.object({
    userId: z.string().optional(),
    studentId: z.string().optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    deviceToken: z.string().optional()
  }).optional(),
  content: z.object({
    subject: z.string().optional(),
    title: z.string().optional(),
    message: z.string().optional(),
    template: z.string().optional(),
    templateData: z.any().optional(),
    attachments: z.array(z.object({
      fileName: z.string(),
      fileUrl: z.string(),
      mimeType: z.string()
    })).optional()
  }).optional()
});





// Validation middleware
export const validateRequest = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = schema.parse({
        ...req.body,
        ...req.params,
        ...req.query,
      });
      
      req.validatedData = validatedData;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: error.issues.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
      }
      next(error);
    }
  };
};

// Type helpers
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type VerifyOTPInput = z.infer<typeof verifyOTPSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type FirebaseAuthInput = z.infer<typeof firebaseAuthSchema>;
export type CreateStudentInput = z.infer<typeof createStudentSchema>;
export type UpdateStudentInput = z.infer<typeof updateStudentSchema>;
export type CreateHostelInput = z.infer<typeof createHostelSchema>;
export type UpdateHostelInput = z.infer<typeof updateHostelSchema>;
export type CreateRoomInput = z.infer<typeof createRoomSchema>;
export type UpdateRoomInput = z.infer<typeof updateRoomSchema>;
export type CreateBedInput = z.infer<typeof createBedSchema>;
export type UpdateBedInput = z.infer<typeof updateBedSchema>;
export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type UpdateBookingInput = z.infer<typeof updateBookingSchema>;
export type CreatePaymentIntentInput = z.infer<typeof createPaymentIntentSchema>;
export type RefundInput = z.infer<typeof refundSchema>;
export type CreateFeePolicyInput = z.infer<typeof createFeePolicySchema>;
export type UpdateFeePolicyInput = z.infer<typeof updateFeePolicySchema>;
export type CreateAllocationRuleInput = z.infer<typeof createAllocationRuleSchema>;
export type UpdateAllocationRuleInput = z.infer<typeof updateAllocationRuleSchema>;
export type CreateAllocationRequestInput = z.infer<typeof createAllocationRequestSchema>;
export type UpdateAllocationRequestInput = z.infer<typeof updateAllocationRequestSchema>;



export type CreateNotificationInput = z.infer<typeof createNotificationSchema>;
export type UpdateNotificationInput = z.infer<typeof updateNotificationSchema>;

// Payment Schemas
export const createPaymentSchema = z.object({
  bookingId: z.string().min(1, 'Booking ID is required'),
  amount: z.number().positive('Amount must be positive'),
  currency: z.enum(['INR', 'USD']).default('INR'),
  paymentMethod: z.enum(['CARD', 'UPI', 'NET_BANKING', 'WALLET', 'CASH']),
  paymentGateway: z.enum(['STRIPE', 'RAZORPAY']).optional(),
  description: z.string().optional(),
  dueDate: z.string().datetime().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

export const updatePaymentSchema = z.object({
  status: z.enum(['PENDING', 'PROCESSING', 'SUCCEEDED', 'FAILED', 'CANCELLED', 'REFUNDED']).optional(),
  transactionId: z.string().optional(),
  gatewayTransactionId: z.string().optional(),
  gatewayResponse: z.record(z.string(), z.any()).optional(),
  refundAmount: z.number().positive().optional(),
  refundReason: z.string().optional(),
  refundStatus: z.enum(['PENDING', 'PROCESSED', 'FAILED']).optional(),
  processingFees: z.number().optional(),
  taxAmount: z.number().optional(),
  netAmount: z.number().optional(),
  description: z.string().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type UpdatePaymentInput = z.infer<typeof updatePaymentSchema>;

// Gateway Schemas
export const createRouteSchema = z.object({
  path: z.string().min(1, 'Path is required'),
  method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']),
  service: z.string().min(1, 'Service is required'),
  targetUrl: z.string().url('Target URL must be valid'),
  timeout: z.number().min(1000).max(30000).default(5000),
  retries: z.number().min(0).max(5).default(3),
  rateLimit: z.object({
    windowMs: z.number().min(1000).default(900000),
    max: z.number().min(1).default(100)
  }).optional(),
  authentication: z.object({
    required: z.boolean().default(true),
    roles: z.array(z.string()).optional()
  }).optional(),
  caching: z.object({
    enabled: z.boolean().default(false),
    ttl: z.number().min(60).default(300)
  }).optional(),
  transformation: z.object({
    request: z.record(z.string(), z.any()).optional(),
    response: z.record(z.string(), z.any()).optional()
  }).optional(),
  isActive: z.boolean().default(true),
  metadata: z.record(z.string(), z.any()).optional()
});

export const updateRouteSchema = z.object({
  path: z.string().min(1).optional(),
  method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']).optional(),
  service: z.string().min(1).optional(),
  targetUrl: z.string().url().optional(),
  timeout: z.number().min(1000).max(30000).optional(),
  retries: z.number().min(0).max(5).optional(),
  rateLimit: z.object({
    windowMs: z.number().min(1000),
    max: z.number().min(1)
  }).optional(),
  authentication: z.object({
    required: z.boolean(),
    roles: z.array(z.string())
  }).optional(),
  caching: z.object({
    enabled: z.boolean(),
    ttl: z.number().min(60)
  }).optional(),
  transformation: z.object({
    request: z.record(z.string(), z.any()),
    response: z.record(z.string(), z.any())
  }).optional(),
  isActive: z.boolean().optional(),
  metadata: z.record(z.string(), z.any()).optional()
});

export const updateServiceHealthSchema = z.object({
  serviceName: z.string().min(1, 'Service name is required'),
  status: z.enum(['HEALTHY', 'UNHEALTHY', 'DEGRADED', 'UNKNOWN']).optional(),
  responseTime: z.number().min(0).optional(),
  uptime: z.number().min(0).optional(),
  version: z.string().optional(),
  endpoints: z.array(z.object({
    path: z.string(),
    method: z.string(),
    status: z.enum(['UP', 'DOWN']),
    responseTime: z.number(),
    lastCheck: z.string().datetime()
  })).optional(),
  metadata: z.record(z.string(), z.any()).optional(),
  errors: z.array(z.object({
    timestamp: z.string().datetime(),
    error: z.string(),
    severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])
  })).optional()
});

export const requestLogsFilterSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
  service: z.string().optional(),
  statusCode: z.number().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional()
});

export const gatewayStatsSchema = z.object({
  period: z.enum(['1h', '24h', '7d', '30d']).default('24h')
});

export const clearCacheSchema = z.object({
  pattern: z.string().optional()
});

export type CreateRouteInput = z.infer<typeof createRouteSchema>;
export type UpdateRouteInput = z.infer<typeof updateRouteSchema>;
export type UpdateServiceHealthInput = z.infer<typeof updateServiceHealthSchema>;
export type RequestLogsFilterInput = z.infer<typeof requestLogsFilterSchema>;
export type GatewayStatsInput = z.infer<typeof gatewayStatsSchema>;
export type ClearCacheInput = z.infer<typeof clearCacheSchema>;

// Admin Service Schemas
export const createAdminSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  fullName: z.string().min(1, 'Full name is required'),
  role: z.enum(['ADMIN', 'STAFF']).default('STAFF'),
  permissions: z.array(z.string()).optional(),
  isActive: z.boolean().default(true),
  metadata: z.record(z.string(), z.any()).optional()
});

export const updateAdminSchema = z.object({
  email: z.string().email('Invalid email format').optional(),
  fullName: z.string().min(1, 'Full name is required').optional(),
  role: z.enum(['ADMIN', 'STAFF']).optional(),
  permissions: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
  metadata: z.record(z.string(), z.any()).optional()
});

export const createReportSchema = z.object({
  name: z.string().min(1, 'Report name is required'),
  type: z.enum(['OCCUPANCY', 'REVENUE', 'STUDENT', 'HOSTEL', 'BOOKING', 'PAYMENT', 'AUDIT']),
  description: z.string().optional(),
  filters: z.record(z.string(), z.any()).optional(),
  format: z.enum(['JSON', 'CSV', 'PDF', 'EXCEL']).default('JSON'),
  schedule: z.object({
    frequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY']).optional(),
    nextRun: z.string().datetime().optional(),
    isActive: z.boolean().default(false)
  }).optional(),
  metadata: z.record(z.string(), z.any()).optional()
});

export const updateReportSchema = z.object({
  name: z.string().min(1, 'Report name is required').optional(),
  description: z.string().optional(),
  filters: z.record(z.string(), z.any()).optional(),
  format: z.enum(['JSON', 'CSV', 'PDF', 'EXCEL']).optional(),
  schedule: z.object({
    frequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY']).optional(),
    nextRun: z.string().datetime().optional(),
    isActive: z.boolean().optional()
  }).optional(),
  isActive: z.boolean().optional(),
  metadata: z.record(z.string(), z.any()).optional()
});

export const createAuditLogSchema = z.object({
  action: z.string().min(1, 'Action is required'),
  entity: z.string().min(1, 'Entity is required'),
  entityId: z.string().min(1, 'Entity ID is required'),
  userId: z.string().min(1, 'User ID is required'),
  userRole: z.string().min(1, 'User role is required'),
  changes: z.object({
    before: z.any().optional(),
    after: z.any().optional(),
    fields: z.array(z.string()).optional()
  }).optional(),
  metadata: z.record(z.string(), z.any()).optional(),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('LOW')
});

export const auditLogFiltersSchema = z.object({
  action: z.string().optional(),
  entity: z.string().optional(),
  entityId: z.string().optional(),
  userId: z.string().optional(),
  userRole: z.string().optional(),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
  sortBy: z.string().default('timestamp'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

export type CreateAdminInput = z.infer<typeof createAdminSchema>;
export type UpdateAdminInput = z.infer<typeof updateAdminSchema>;
export type CreateReportInput = z.infer<typeof createReportSchema>;
export type UpdateReportInput = z.infer<typeof updateReportSchema>;
export type CreateAuditLogInput = z.infer<typeof createAuditLogSchema>;
export type AuditLogFiltersInput = z.infer<typeof auditLogFiltersSchema>;
