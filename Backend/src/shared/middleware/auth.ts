import { Request, Response, NextFunction } from 'express';
import { jwtService } from '../utils/jwt';
import { JWTPayload } from '../../types';

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
      validatedData?: any;
    }
  }
}

export class AuthMiddleware {
  /**
   * Middleware to authenticate JWT token
   */
  public static authenticate = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader) {
        res.status(401).json({
          success: false,
          error: 'Authorization header missing',
        });
        return;
      }

      const token = jwtService.extractTokenFromHeader(authHeader);
      const decoded = jwtService.verifyAccessToken(token);
      
      req.user = decoded;
      next();
    } catch (error) {
      res.status(401).json({
        success: false,
        error: 'Invalid or expired token',
      });
    }
  };

  /**
   * Middleware to check if user has required role
   */
  public static requireRole = (roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
        return;
      }

      if (!roles.includes(req.user.role)) {
        res.status(403).json({
          success: false,
          error: 'Insufficient permissions',
        });
        return;
      }

      next();
    };
  };

  /**
   * Middleware to check if user is admin
   */
  public static requireAdmin = (req: Request, res: Response, next: NextFunction): void => {
    AuthMiddleware.requireRole(['ADMIN'])(req, res, next);
  };

  /**
   * Middleware to check if user is student
   */
  public static requireStudent = (req: Request, res: Response, next: NextFunction): void => {
    AuthMiddleware.requireRole(['STUDENT'])(req, res, next);
  };

  /**
   * Middleware to check if user is staff or admin
   */
  public static requireStaff = (req: Request, res: Response, next: NextFunction): void => {
    AuthMiddleware.requireRole(['STAFF', 'ADMIN'])(req, res, next);
  };

  /**
   * Middleware to check if user can access their own data or is admin
   */
  public static requireOwnershipOrAdmin = (paramName: string = 'id') => {
    return (req: Request, res: Response, next: NextFunction): void => {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
        return;
      }

      const resourceId = req.params[paramName] || req.body.userId;
      
      // Admin can access any resource
      if (req.user.role === 'ADMIN') {
        next();
        return;
      }

      // Users can only access their own data
      if (req.user.userId === resourceId) {
        next();
        return;
      }

      res.status(403).json({
        success: false,
        error: 'Access denied',
      });
    };
  };

  /**
   * Middleware to check if user can access student data
   */
  public static requireStudentAccess = (paramName: string = 'studentId') => {
    return (req: Request, res: Response, next: NextFunction): void => {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
        return;
      }

      const studentId = req.params[paramName] || req.body.studentId;
      
      // Admin and staff can access any student data
      if (['ADMIN', 'STAFF'].includes(req.user.role)) {
        next();
        return;
      }

      // Students can only access their own data
      if (req.user.role === 'STUDENT' && req.user.userId === studentId) {
        next();
        return;
      }

      res.status(403).json({
        success: false,
        error: 'Access denied to student data',
      });
    };
  };

  /**
   * Middleware to check if user can access hostel data
   */
  public static requireHostelAccess = (paramName: string = 'hostelId') => {
    return (req: Request, res: Response, next: NextFunction): void => {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
        return;
      }

      // Admin and staff can access any hostel data
      if (['ADMIN', 'STAFF'].includes(req.user.role)) {
        next();
        return;
      }

      // Students can access hostel data for viewing
      if (req.user.role === 'STUDENT' && req.method === 'GET') {
        next();
        return;
      }

      res.status(403).json({
        success: false,
        error: 'Access denied to hostel data',
      });
    };
  };

  /**
   * Middleware to check if user can access booking data
   */
  public static requireBookingAccess = (paramName: string = 'bookingId') => {
    return (req: Request, res: Response, next: NextFunction): void => {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
        return;
      }

      const bookingId = req.params[paramName] || req.body.bookingId;
      
      // Admin and staff can access any booking data
      if (['ADMIN', 'STAFF'].includes(req.user.role)) {
        next();
        return;
      }

      // Students can only access their own bookings
      if (req.user.role === 'STUDENT') {
        // This would typically require a database lookup to verify ownership
        // For now, we'll allow access and let the service layer handle the check
        next();
        return;
      }

      res.status(403).json({
        success: false,
        error: 'Access denied to booking data',
      });
    };
  };

  /**
   * Middleware to check if user can access payment data
   */
  public static requirePaymentAccess = (paramName: string = 'paymentId') => {
    return (req: Request, res: Response, next: NextFunction): void => {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: 'Authentication required',
        });
        return;
      }

      const paymentId = req.params[paramName] || req.body.paymentId;
      
      // Admin and staff can access any payment data
      if (['ADMIN', 'STAFF'].includes(req.user.role)) {
        next();
        return;
      }

      // Students can only access their own payments
      if (req.user.role === 'STUDENT') {
        // This would typically require a database lookup to verify ownership
        // For now, we'll allow access and let the service layer handle the check
        next();
        return;
      }

      res.status(403).json({
        success: false,
        error: 'Access denied to payment data',
      });
    };
  };

  /**
   * Middleware to check if user can access sensitive data (like category/caste)
   */
  public static requireSensitiveDataAccess = (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    // Only admin can access sensitive data like category/caste
    if (req.user.role !== 'ADMIN') {
      res.status(403).json({
        success: false,
        error: 'Access denied to sensitive data',
      });
      return;
    }

    next();
  };

  /**
   * Optional authentication middleware
   */
  public static optionalAuth = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;
      
      if (authHeader) {
        const token = jwtService.extractTokenFromHeader(authHeader);
        const decoded = jwtService.verifyAccessToken(token);
        req.user = decoded;
      }
      
      next();
    } catch (error) {
      // Continue without authentication
      next();
    }
  };
}

export const {
  authenticate,
  requireRole,
  requireAdmin,
  requireStudent,
  requireStaff,
  requireOwnershipOrAdmin,
  requireStudentAccess,
  requireHostelAccess,
  requireBookingAccess,
  requirePaymentAccess,
  requireSensitiveDataAccess,
  optionalAuth,
} = AuthMiddleware;
