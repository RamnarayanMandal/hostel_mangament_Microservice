import { ObjectId } from 'mongoose';
import { Document, Model } from 'mongoose';

// Base interfaces
export interface BaseEntity {
  _id: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// Identity & User Management
export interface User extends BaseEntity {
  role: 'STUDENT' | 'ADMIN' | 'STAFF';
  email: string;
  phone?: string;
  passwordHash: string;
  fullName: string;
  firstName?: string;
  lastName?: string;
  gender?: 'male' | 'female' | 'other';
  isEmailVerified?: boolean;
  isActive: boolean;
  lastLoginAt?: Date;
  firebaseUid?: string;
}

export interface StudentProfile extends BaseEntity {
  userId: ObjectId; // FK to Identity
  enrollmentNo: string;
  program?: string;
  year: number;
  semester?: number;
  category?: 'GEN' | 'OBC' | 'SC' | 'ST' | 'EWS' | string; // optional & access-controlled
  domicileState?: string;
  seniorityScore: number; // derived from year/credits/tenure
  kycStatus?: 'PENDING' | 'VERIFIED' | 'REJECTED';
  documents?: Array<{
    type: string;
    url: string;
    verified: boolean;
  }>;
}

// Hostel Management
export interface Hostel extends BaseEntity {
  name: string;
  campus: string;
  address: string;
  amenities: string[];
  contactInfo: {
    phone: string;
    email: string;
  };
  capacity: number;
  isActive: boolean;
}

export interface Room extends BaseEntity {
  hostelId: ObjectId;
  number: string;
  type: 'SINGLE' | 'DOUBLE' | 'TRIPLE' | 'DORM';
  genderPolicy?: 'MALE' | 'FEMALE' | 'ANY';
  priceTier?: string;
  status: 'OPEN' | 'MAINTENANCE' | 'BLOCKED';
  floor: number;
  block?: string;
}

export interface Bed extends BaseEntity {
  roomId: ObjectId;
  bedNo: string; // e.g. A/B/C
  status: 'AVAILABLE' | 'ON_HOLD' | 'ALLOCATED' | 'BLOCKED';
  occupantBookingId?: ObjectId; // when allocated
  holdExpiresAt?: Date;
}

// Allocation & Rules
export interface AllocationRule extends BaseEntity {
  name: string;
  active: boolean;
  scope: {
    hostelId?: ObjectId;
    roomType?: string;
    genderPolicy?: string;
  };
  priority: number; // smaller = higher priority
  criteria: {
    minSeniority?: number;
    program?: string[];
    year?: number[];
  };
  reservedQuota?: Array<{
    category?: string;
    percent?: number;
  }>; // optional quotas
}

export interface Allocation extends BaseEntity {
  bedId: ObjectId;
  bookingId: ObjectId;
  studentId: ObjectId;
  allocatedAt: Date;
  releasedAt?: Date;
  source: 'AUTO' | 'ADMIN';
  overrideReason?: string;
}

// Pricing & Fee Policy
export interface FeePolicy extends BaseEntity {
  name: string;
  description?: string;
  hostelId: ObjectId;
  roomType: 'SINGLE' | 'DOUBLE' | 'TRIPLE' | 'DORM';
  baseMonthlyFee: number;
  currency: 'INR' | 'USD';
  effectiveFrom: Date;
  effectiveTo?: Date;
  isActive: boolean;
  adjustments: Array<{
    type: 'CATEGORY_CONCESSION' | 'SCHOLARSHIP' | 'SURCHARGE' | 'EARLY_BIRD' | 'LATE_FEE';
    name: string;
    description?: string;
    match: {
      category?: string;
      year?: number;
      domicileState?: string;
      program?: string;
      kycStatus?: string;
      seniorityScore?: {
        min: number;
        max: number;
      };
    };
    value: {
      kind: 'PERCENT' | 'FLAT';
      amount: number;
      maxAmount?: number;
    };
    priority: number;
    isActive: boolean;
    validFrom: Date;
    validTo?: Date;
  }>;
  paymentTerms: {
    dueDate: number;
    gracePeriod: number;
    lateFeePercentage: number;
    installmentAllowed: boolean;
    maxInstallments: number;
  };
  refundPolicy: {
    cancellationAllowed: boolean;
    refundPercentage: number;
    processingDays: number;
  };
  createdBy: ObjectId;
  updatedBy?: ObjectId;
}

export interface FeeQuote {
  bookingId?: ObjectId;
  hostelId: ObjectId;
  roomType: string;
  studentId: ObjectId;
  monthlyFee: number;
  breakdown: Array<{
    description: string;
    amount: number;
    type: 'BASE' | 'CONCESSION' | 'SURCHARGE';
  }>;
  totalAmount: number;
  currency: 'INR' | 'USD';
}

// Booking & Payment
export interface Booking extends BaseEntity {
  bookingId: string;
  studentId: ObjectId;
  hostelId: ObjectId;
  roomId: ObjectId;
  bedId?: ObjectId;
  feePolicyId?: ObjectId;
  status: 'HOLD' | 'PENDING_PAYMENT' | 'CONFIRMED' | 'CANCELLED' | 'CHECKED_IN' | 'CHECKED_OUT';
  startDate: Date;
  endDate?: Date;
  checkInDate: Date;
  checkOutDate: Date;
  checkInAt?: Date;
  checkOutAt?: Date;
  duration: number; // in months
  totalAmount: number;
  amountDue: number;
  amountPaid: number;
  currency: 'INR' | 'USD';
  dueDate: Date;
  expiresAt?: Date;
  paymentStatus: 'PENDING' | 'PARTIAL' | 'COMPLETED' | 'FAILED';
  paymentHistory: Array<{
    paymentId: ObjectId;
    amount: number;
    paymentDate: Date;
    paymentMethod: string;
    status: string;
    transactionId?: string;
  }>;
  terms: {
    accepted: boolean;
    version: string;
    acceptedAt?: Date;
    acceptedBy?: ObjectId;
  };
  checkIn?: {
    checkedInAt: Date;
    checkedInBy: string;
    notes?: string;
    condition?: string;
  };
  checkOut?: {
    checkedOutAt: Date;
    checkedOutBy: string;
    notes?: string;
    damages?: Array<{
      description: string;
      severity: 'LOW' | 'MEDIUM' | 'HIGH';
      estimatedCost?: number;
    }>;
  };
  cancellation?: {
    requestedAt?: Date;
    requestedBy?: string;
    reason?: string;
    refundAmount?: number;
    processedAt?: Date;
    processedBy?: string;
  };
  payments: Array<{
    paymentId: string;
    amount: number;
    method: 'CARD' | 'UPI' | 'NET_BANKING' | 'WALLET' | 'CASH';
    status: 'PENDING' | 'SUCCESS' | 'FAILED';
    transactionId?: string;
    paidAt?: Date;
    notes?: string;
  }>;
  specialRequests: Array<{
    type: string;
    description: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    requestedAt: Date;
    requestedBy: string;
    processedAt?: Date;
    processedBy?: string;
    notes?: string;
  }>;
  documents: Array<{
    type: string;
    fileName: string;
    fileUrl: string;
    uploadedAt: Date;
    uploadedBy: string;
    verified: boolean;
    verifiedBy?: string;
    verifiedAt?: Date;
  }>;
  notifications: Array<{
    type: string;
    sentAt: Date;
    status: 'SENT' | 'DELIVERED' | 'FAILED';
    recipient: string;
    content: string;
  }>;
  metadata: {
    source: string;
    userAgent?: string;
    ipAddress?: string;
    referrer?: string;
  };
  createdBy: ObjectId;
  updatedBy?: ObjectId;
}

export interface Payment extends BaseEntity {
  paymentId: string;
  bookingId: ObjectId;
  studentId: ObjectId;
  amount: number;
  currency: 'INR' | 'USD';
  paymentMethod: 'CASH' | 'CARD' | 'UPI' | 'NET_BANKING' | 'WALLET' | 'CHEQUE' | 'BANK_TRANSFER';
  paymentGateway: 'STRIPE' | 'RAZORPAY' | 'PAYTM' | 'CASH' | 'CHEQUE' | 'BANK_TRANSFER';
  status: 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILED' | 'CANCELLED' | 'REFUNDED' | 'PARTIALLY_REFUNDED';
  transactionId?: string;
  gatewayTransactionId?: string;
  gatewayResponse?: any;
  gatewayError?: string;
  paymentIntentId?: string;
  refundId?: string;
  refundAmount: number;
  refundReason?: string;
  refundStatus: 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILED';
  paymentDate: Date;
  refundDate?: Date;
  dueDate?: Date;
  lateFees: number;
  discount: number;
  taxAmount: number;
  processingFees: number;
  netAmount: number;
  description?: string;
  metadata: {
    source: string;
    userAgent?: string;
    ipAddress?: string;
    deviceInfo?: string;
    sessionId?: string;
  };
  receipt: {
    receiptNumber?: string;
    receiptUrl?: string;
    generatedAt?: Date;
  };
  webhookEvents: Array<{
    eventType: string;
    eventData: any;
    receivedAt: Date;
    processed: boolean;
    processedAt?: Date;
  }>;
  retryAttempts: number;
  maxRetries: number;
  nextRetryAt?: Date;
  createdBy: ObjectId;
  updatedBy?: ObjectId;
}

export interface PaymentIntent extends BaseEntity {
  bookingId: ObjectId;
  provider: 'RAZORPAY' | 'STRIPE';
  amount: number;
  currency: string;
  status: 'CREATED' | 'SUCCEEDED' | 'FAILED' | 'REFUNDED';
  providerRef?: string;
  idempotencyKey: string;
  metadata?: Record<string, any>;
}

export interface Transaction extends BaseEntity {
  paymentIntentId: ObjectId;
  amount: number;
  currency: string;
  type: 'PAYMENT' | 'REFUND';
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  providerRef: string;
  metadata?: Record<string, any>;
}

// Notifications
export interface NotificationTemplate extends BaseEntity {
  name: string;
  type: 'EMAIL' | 'SMS' | 'WHATSAPP' | 'PUSH';
  subject?: string;
  content: string;
  variables: string[];
  isActive: boolean;
}

export interface Notification extends BaseEntity {
  notificationId: string;
  type: 'EMAIL' | 'SMS' | 'PUSH' | 'IN_APP' | 'WHATSAPP';
  category: 'BOOKING' | 'PAYMENT' | 'ALLOCATION' | 'SYSTEM' | 'REMINDER' | 'ALERT';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'PENDING' | 'SENT' | 'DELIVERED' | 'FAILED' | 'CANCELLED';
  recipient: {
    userId?: ObjectId;
    studentId?: ObjectId;
    email?: string;
    phone?: string;
    deviceToken?: string;
  };
  content: {
    subject?: string;
    title?: string;
    message: string;
    template?: string;
    templateData?: Record<string, any>;
    attachments?: Array<{
      fileName: string;
      fileUrl: string;
      mimeType: string;
    }>;
  };
  metadata: {
    source: string;
    eventType?: string;
    eventId?: string;
    correlationId?: string;
    userAgent?: string;
    ipAddress?: string;
  };
  delivery: {
    scheduledAt?: Date;
    sentAt?: Date;
    deliveredAt?: Date;
    failedAt?: Date;
    retryCount: number;
    maxRetries: number;
    nextRetryAt?: Date;
    provider?: string;
    providerResponse?: Record<string, any>;
    providerError?: string;
  };
  tracking: {
    openedAt?: Date;
    clickedAt?: Date;
    clickedLinks: string[];
    userAgent?: string;
    ipAddress?: string;
  };
  preferences: {
    emailEnabled: boolean;
    smsEnabled: boolean;
    pushEnabled: boolean;
    inAppEnabled: boolean;
    whatsappEnabled: boolean;
  };
  createdBy?: ObjectId;
  updatedBy?: ObjectId;
}

export interface NotificationLog extends BaseEntity {
  templateId: ObjectId;
  recipientId: ObjectId;
  type: 'EMAIL' | 'SMS' | 'WHATSAPP' | 'PUSH';
  status: 'PENDING' | 'SENT' | 'FAILED';
  content: string;
  metadata?: Record<string, any>;
}

// Events
export interface EventMessage {
  id: string;
  type: string;
  service: string;
  data: any;
  timestamp: Date;
  correlationId?: string;
  idempotencyKey?: string;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  timestamp: Date;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// JWT Payload
export interface JWTPayload {
  id: string;
  role: string;
  email: string;
  iat?: number;
  exp?: number;
}

// Request Context
export interface RequestContext {
  userId?: string;
  role?: string;
  correlationId: string;
  userAgent?: string;
  ip?: string;
}

// Search and Filter Types
export interface SearchFilters {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

export interface HostelSearchFilters extends SearchFilters {
  campus?: string;
  amenities?: string[];
  isActive?: boolean;
}

export interface RoomSearchFilters extends SearchFilters {
  hostelId?: string;
  type?: string;
  genderPolicy?: string;
  status?: string;
  floor?: number;
}

export interface BookingSearchFilters extends SearchFilters {
  studentId?: string;
  hostelId?: string;
  status?: string;
  startDate?: Date;
  endDate?: Date;
}

// DTOs and Input Types
export interface CreateBookingInput {
  studentId: string;
  hostelId: string;
  roomId: string;
  bedId?: string;
  feePolicyId?: string;
  startDate: string;
  endDate?: string;
  specialRequests?: Array<{
    type: string;
    description: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
  }>;
}

export interface UpdateBookingInput {
  status?: 'HOLD' | 'PENDING_PAYMENT' | 'CONFIRMED' | 'CANCELLED' | 'CHECKED_IN' | 'CHECKED_OUT';
  startDate?: string;
  endDate?: string;
  amountDue?: number;
  paymentStatus?: 'PENDING' | 'PARTIAL' | 'COMPLETED' | 'FAILED';
  specialRequests?: Array<{
    type: string;
    description: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
  }>;
}

export interface CreatePaymentInput {
  bookingId: string;
  studentId: string;
  amount: number;
  currency: 'INR' | 'USD';
  method: 'CARD' | 'UPI' | 'NET_BANKING' | 'WALLET' | 'CASH';
  provider: 'RAZORPAY' | 'STRIPE' | 'CASH';
  transactionId?: string;
  gatewayRef?: string;
  notes?: string;
  metadata?: Record<string, any>;
}

export interface UpdatePaymentInput {
  status?: 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';
  transactionId?: string;
  gatewayRef?: string;
  paidAt?: string;
  refundedAt?: string;
  refundAmount?: number;
  notes?: string;
  metadata?: Record<string, any>;
}

export interface CreateNotificationInput {
  type: 'EMAIL' | 'SMS' | 'PUSH' | 'IN_APP' | 'WHATSAPP';
  category: 'BOOKING' | 'PAYMENT' | 'ALLOCATION' | 'SYSTEM' | 'REMINDER' | 'ALERT';
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  recipient: {
    userId?: string;
    studentId?: string;
    email?: string;
    phone?: string;
    deviceToken?: string;
  };
  content: {
    subject?: string;
    title?: string;
    message: string;
    template?: string;
    templateData?: Record<string, any>;
    attachments?: Array<{
      fileName: string;
      fileUrl: string;
      mimeType: string;
    }>;
  };
  metadata?: {
    source?: string;
    eventType?: string;
    eventId?: string;
    correlationId?: string;
    userAgent?: string;
    ipAddress?: string;
  };
  delivery?: {
    scheduledAt?: string;
    maxRetries?: number;
  };
  preferences?: {
    emailEnabled?: boolean;
    smsEnabled?: boolean;
    pushEnabled?: boolean;
    inAppEnabled?: boolean;
    whatsappEnabled?: boolean;
  };
}

export interface UpdateNotificationInput {
  type?: 'EMAIL' | 'SMS' | 'PUSH' | 'IN_APP' | 'WHATSAPP';
  category?: 'BOOKING' | 'PAYMENT' | 'ALLOCATION' | 'SYSTEM' | 'REMINDER' | 'ALERT';
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status?: 'PENDING' | 'SENT' | 'DELIVERED' | 'FAILED' | 'CANCELLED';
  recipient?: {
    userId?: string;
    studentId?: string;
    email?: string;
    phone?: string;
    deviceToken?: string;
  };
  content?: {
    subject?: string;
    title?: string;
    message?: string;
    template?: string;
    templateData?: Record<string, any>;
    attachments?: Array<{
      fileName: string;
      fileUrl: string;
      mimeType: string;
    }>;
  };
  metadata?: {
    source?: string;
    eventType?: string;
    eventId?: string;
    correlationId?: string;
    userAgent?: string;
    ipAddress?: string;
  };
  delivery?: {
    scheduledAt?: string;
    sentAt?: string;
    deliveredAt?: string;
    failedAt?: string;
    retryCount?: number;
    maxRetries?: number;
    nextRetryAt?: string;
    provider?: string;
    providerResponse?: any;
    providerError?: string;
  };
  tracking?: {
    openedAt?: string;
    clickedAt?: string;
    clickedLinks?: string[];
    userAgent?: string;
    ipAddress?: string;
  };
  preferences?: {
    emailEnabled?: boolean;
    smsEnabled?: boolean;
    pushEnabled?: boolean;
    inAppEnabled?: boolean;
    whatsappEnabled?: boolean;
  };
}

// Service Method Interfaces
export interface BookingServiceMethods {
  canBeCancelled(): boolean;
  canCheckIn(): boolean;
  canCheckOut(): boolean;
  requestCancellation(reason: string, cancelledBy: string): Promise<void>;
  checkIn(data: any): Promise<void>;
  checkOut(data: any): Promise<void>;
  addPayment(paymentData: any): Promise<void>;
}

export interface NotificationServiceMethods {
  isPending(): boolean;
  canRetry(): boolean;
  markAsSent(providerResponse: any): Promise<void>;
  markAsDelivered(): Promise<void>;
  markAsFailed(errorData: { error: string; response?: any }): Promise<void>;
}

export interface BookingStaticMethods {
  findOverlappingBookings(bedId: string, startDate: Date, endDate: Date, excludeBookingId?: string): Promise<BookingDocument[]>;
  findExpiredBookings(): Promise<BookingDocument[]>;
}

export interface NotificationStaticMethods {
  findByRecipient(recipientId: string, type?: string): Promise<NotificationDocument[]>;
  findPendingNotifications(): Promise<NotificationDocument[]>;
  findFailedNotifications(): Promise<NotificationDocument[]>;
}

// Document Interfaces with Methods
export interface BookingDocument extends Omit<Booking, 'checkIn' | 'checkOut' | '_id'>, Document, BookingServiceMethods {}

export interface NotificationDocument extends Omit<Notification, '_id'>, Document, NotificationServiceMethods {}

// Model Interfaces with Static Methods
export interface BookingModel extends Model<BookingDocument>, BookingStaticMethods {}

export interface NotificationModel extends Model<NotificationDocument>, NotificationStaticMethods {}


