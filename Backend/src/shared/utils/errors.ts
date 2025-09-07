export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly code?: string;

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true,
    code?: string
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.code = code;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, true, 'VALIDATION_ERROR');
    this.details = details;
  }

  public details?: any;
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super(message, 401, true, 'AUTHENTICATION_ERROR');
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Access denied') {
    super(message, 403, true, 'AUTHORIZATION_ERROR');
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404, true, 'NOT_FOUND_ERROR');
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Resource conflict') {
    super(message, 409, true, 'CONFLICT_ERROR');
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 429, true, 'RATE_LIMIT_ERROR');
  }
}

export class DatabaseError extends AppError {
  constructor(message: string = 'Database operation failed') {
    super(message, 500, true, 'DATABASE_ERROR');
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, message: string = 'External service error') {
    super(`${service}: ${message}`, 502, true, 'EXTERNAL_SERVICE_ERROR');
    this.service = service;
  }

  public service: string;
}

export class PaymentError extends AppError {
  constructor(message: string = 'Payment processing failed') {
    super(message, 400, true, 'PAYMENT_ERROR');
  }
}

export class BookingError extends AppError {
  constructor(message: string = 'Booking operation failed') {
    super(message, 400, true, 'BOOKING_ERROR');
  }
}

export class AllocationError extends AppError {
  constructor(message: string = 'Allocation operation failed') {
    super(message, 400, true, 'ALLOCATION_ERROR');
  }
}

// Error handler middleware
export const errorHandler = (err: any, req: any, res: any, next: any) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    url: req?.url,
    method: req?.method,
    userId: req?.user?.userId,
    correlationId: req?.headers['x-correlation-id'],
  });

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = new NotFoundError();
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `Duplicate field value: ${field}`;
    error = new ConflictError(message);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map((val: any) => val.message).join(', ');
    error = new ValidationError(message);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = new AuthenticationError('Invalid token');
  }

  if (err.name === 'TokenExpiredError') {
    error = new AuthenticationError('Token expired');
  }

  // Default error response
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    error: message,
    code: error.code || 'INTERNAL_ERROR',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    timestamp: new Date().toISOString(),
  });
};

// Async error wrapper
export const asyncHandler = (fn: Function) => {
  return (req: any, res: any, next: any) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Error response helper
export const errorResponse = (res: any, error: AppError | string, statusCode?: number) => {
  const message = typeof error === 'string' ? error : error.message;
  const code = typeof error === 'string' ? 'CUSTOM_ERROR' : error.code;
  const finalStatusCode = statusCode || (typeof error === 'string' ? 500 : error.statusCode);

  return res.status(finalStatusCode).json({
    success: false,
    error: message,
    code,
    timestamp: new Date().toISOString(),
  });
};

// Success response helper
export const successResponse = (res: any, data: any, message?: string, statusCode: number = 200) => {
  return res.status(statusCode).json({
    success: true,
    data,
    message,
    timestamp: new Date().toISOString(),
  });
};

// Paginated response helper
export const paginatedResponse = (
  res: any,
  data: any[],
  page: number,
  limit: number,
  total: number,
  message?: string
) => {
  const totalPages = Math.ceil(total / limit);

  return res.status(200).json({
    success: true,
    data,
    message,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
    timestamp: new Date().toISOString(),
  });
};
