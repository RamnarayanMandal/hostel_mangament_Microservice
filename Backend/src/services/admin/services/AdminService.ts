import { Admin, AdminDocument } from '../models/Admin';
import { Report, ReportDocument } from '../models/Report';
import { AuditLog, AuditLogDocument } from '../models/AuditLog';
import { getMessageBroker, EVENT_TYPES } from '../../../shared/config/message-broker';
import { adminLogger } from '../../../shared/utils/logger';
import { AppError } from '../../../shared/utils/errors';
import { Types } from 'mongoose';
import { User, UserDocument } from '../../auth/models/User';

interface AdminEventData {
  adminId: Types.ObjectId;
  email: string;
  role: string;
  permissions?: string[];
}

interface AdminCreateData extends AdminEventData {
  // Additional fields for create event
}

interface AdminUpdateData extends AdminEventData {
  // Additional fields for update event
}

interface AdminDeleteData {
  adminId: Types.ObjectId;
  email: string;
}

interface AdminFilters {
  role?: string;
  isActive?: boolean;
  email?: string;
  search?: string;
}

interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface UserFilters {
  search?: string;
  role?: string;
  isActive?: boolean;
}

interface ReportFilters {
  type?: string;
  isActive?: boolean;
  generatedBy?: string;
  startDate?: Date;
  endDate?: Date;
}

interface AuditLogFilters {
  action?: string;
  entity?: string;
  entityId?: string;
  userId?: string;
  userRole?: string;
  severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  startDate?: Date;
  endDate?: Date;
}

interface DashboardStats {
  totalStudents: number;
  totalHostels: number;
  totalBookings: number;
  totalPayments: number;
  recentAuditLogs: AuditLogDocument[];
  systemHealth: SystemHealth;
  generatedAt: Date;
}

interface SystemHealth {
  status: 'healthy' | 'unhealthy' | 'degraded';
  services: {
    auth: string;
    student: string;
    hostel: string;
    booking: string;
    payment: string;
    notification: string;
  };
  lastChecked: Date;
  error?: string;
}

export class AdminService {
  private messageBroker: any;

  constructor() {
    try {
      this.messageBroker = getMessageBroker();
    } catch (error) {
      console.log('⚠️ MessageBroker not available, continuing without event publishing');
      this.messageBroker = null;
    }
  }

  private async publishEvent(eventType: string, data: any) {
    if (!this.messageBroker) return;
    
    try {
      await this.messageBroker.publishEvent({
        id: data.userId?.toString() || new Types.ObjectId().toString(),
        type: eventType,
        service: 'admin-service',
        data,
        timestamp: new Date(),
        correlationId: data.userId?.toString() || new Types.ObjectId().toString()
      });
    } catch (error) {
      adminLogger.logger.error('Failed to publish event', { eventType, error: (error as Error).message });
    }
  }

  // Admin Management
  async createAdmin(adminData: Partial<AdminDocument>): Promise<AdminDocument> {
    try {
      const admin = new Admin(adminData);
      await admin.save();

      await this.messageBroker.publishEvent({
        id: (admin as any)._id.toString(),
        type: EVENT_TYPES.ADMIN_CREATED,
        service: 'admin-service',
        data: {
          adminId: (admin as any)._id,
          email: (admin as any).email,
          role: (admin as any).role,
          permissions: (admin as any).permissions
        },
        timestamp: new Date(),
        correlationId: (admin as any)._id.toString()
      });

      adminLogger.logger.info('Admin created', { adminId: (admin as any)._id, email: (admin as any).email });
      return admin;
    } catch (error) {
      adminLogger.logger.error('Failed to create admin', { error: (error as Error).message });
      throw new AppError('Failed to create admin', 500);
    }
  }

  async getAdminById(adminId: string): Promise<AdminDocument | null> {
    try {
      return await Admin.findById(adminId);
    } catch (error) {
      adminLogger.logger.error('Failed to get admin by ID', { adminId, error: (error as Error).message });
      throw new AppError('Failed to get admin', 500);
    }
  }

  async getAdminByEmail(email: string): Promise<AdminDocument | null> {
    try {
      return await Admin.findOne({ email });
    } catch (error) {
      adminLogger.logger.error('Failed to get admin by email', { email, error: (error as Error).message });
      throw new AppError('Failed to get admin', 500);
    }
  }

  async updateAdmin(adminId: string, updateData: Partial<AdminDocument>): Promise<AdminDocument | null> {
    try {
      const admin = await Admin.findByIdAndUpdate(
        adminId,
        { ...updateData, updatedAt: new Date() },
        { new: true, runValidators: true }
      );

      if (admin) {
        await this.messageBroker.publishEvent({
          id: (admin as any)._id.toString(),
          type: EVENT_TYPES.ADMIN_UPDATED,
          service: 'admin-service',
          data: {
            adminId: (admin as any)._id,
            email: (admin as any).email,
            role: (admin as any).role,
            permissions: (admin as any).permissions
          },
          timestamp: new Date(),
          correlationId: (admin as any)._id.toString()
        });
      }

      adminLogger.logger.info('Admin updated', { adminId, email: (admin as any)?.email });
      return admin;
    } catch (error) {
      adminLogger.logger.error('Failed to update admin', { adminId, error: (error as Error).message });
      throw new AppError('Failed to update admin', 500);
    }
  }

  async deleteAdmin(adminId: string): Promise<boolean> {
    try {
      const admin = await Admin.findByIdAndDelete(adminId);
      
      if (admin) {
        await this.messageBroker.publishEvent({
          id: (admin as any)._id.toString(),
          type: EVENT_TYPES.ADMIN_DELETED,
          service: 'admin-service',
          data: {
            adminId: (admin as any)._id,
            email: (admin as any).email
          },
          timestamp: new Date(),
          correlationId: (admin as any)._id.toString()
        });
      }

      adminLogger.logger.info('Admin deleted', { adminId });
      return !!admin;
    } catch (error) {
      adminLogger.logger.error('Failed to delete admin', { adminId, error: (error as Error).message });
      throw new AppError('Failed to delete admin', 500);
    }
  }

  async getAllAdmins(filters: AdminFilters = {}, pagination: PaginationOptions = {}): Promise<{ admins: AdminDocument[], total: number }> {
    try {
      const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;
      const skip = (page - 1) * limit;

      const query = Admin.find(filters);
      const total = await Admin.countDocuments(filters);
      
      const admins = await query
        .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
        .skip(skip)
        .limit(limit);

      return { admins, total };
    } catch (error) {
      adminLogger.logger.error('Failed to get all admins', { error: (error as Error).message });
      throw new AppError('Failed to get admins', 500);
    }
  }

  // Report Management
  async createReport(reportData: Partial<ReportDocument>): Promise<ReportDocument> {
    try {
      const report = new Report(reportData);
      await report.save();

      adminLogger.logger.info('Report created', { reportId: report._id, type: report.type });
      return report;
    } catch (error) {
      adminLogger.logger.error('Failed to create report', { error: (error as Error).message });
      throw new AppError('Failed to create report', 500);
    }
  }

  async getReportById(reportId: string): Promise<ReportDocument | null> {
    try {
      return await Report.findById(reportId);
    } catch (error) {
      adminLogger.logger.error('Failed to get report by ID', { reportId, error: (error as Error).message });
      throw new AppError('Failed to get report', 500);
    }
  }

  async updateReport(reportId: string, updateData: Partial<ReportDocument>): Promise<ReportDocument | null> {
    try {
      const report = await Report.findByIdAndUpdate(
        reportId,
        { ...updateData, updatedAt: new Date() },
        { new: true, runValidators: true }
      );

      adminLogger.logger.info('Report updated', { reportId, type: report?.type });
      return report;
    } catch (error) {
      adminLogger.logger.error('Failed to update report', { reportId, error: (error as Error).message });
      throw new AppError('Failed to update report', 500);
    }
  }

  async deleteReport(reportId: string): Promise<boolean> {
    try {
      const report = await Report.findByIdAndDelete(reportId);
      adminLogger.logger.info('Report deleted', { reportId });
      return !!report;
    } catch (error) {
      adminLogger.logger.error('Failed to delete report', { reportId, error: (error as Error).message });
      throw new AppError('Failed to delete report', 500);
    }
  }

  async getAllReports(filters: ReportFilters = {}, pagination: PaginationOptions = {}): Promise<{ reports: ReportDocument[], total: number }> {
    try {
      const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;
      const skip = (page - 1) * limit;

      const query = Report.find(filters);
      const total = await Report.countDocuments(filters);
      
      const reports = await query
        .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
        .skip(skip)
        .limit(limit);

      return { reports, total };
    } catch (error) {
      adminLogger.logger.error('Failed to get all reports', { error: (error as Error).message });
      throw new AppError('Failed to get reports', 500);
    }
  }

  // Audit Log Management
  async createAuditLog(auditData: Partial<AuditLogDocument>): Promise<AuditLogDocument> {
    try {
      const auditLog = new AuditLog(auditData);
      await auditLog.save();

      adminLogger.logger.info('Audit log created', { 
        auditId: auditLog._id, 
        action: auditLog.action, 
        userId: auditLog.userId 
      });
      return auditLog;
    } catch (error) {
      adminLogger.logger.error('Failed to create audit log', { error: (error as Error).message });
      throw new AppError('Failed to create audit log', 500);
    }
  }

  async getAuditLogById(auditId: string): Promise<AuditLogDocument | null> {
    try {
      return await AuditLog.findById(auditId);
    } catch (error) {
      adminLogger.logger.error('Failed to get audit log by ID', { auditId, error: (error as Error).message });
      throw new AppError('Failed to get audit log', 500);
    }
  }

  async getAllAuditLogs(filters: AuditLogFilters = {}, pagination: PaginationOptions = {}): Promise<{ auditLogs: AuditLogDocument[], total: number }> {
    try {
      const { page = 1, limit = 10, sortBy = 'timestamp', sortOrder = 'desc' } = pagination;
      const skip = (page - 1) * limit;

      const query = AuditLog.find(filters);
      const total = await AuditLog.countDocuments(filters);
      
      const auditLogs = await query
        .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
        .skip(skip)
        .limit(limit);

      return { auditLogs, total };
    } catch (error) {
      adminLogger.logger.error('Failed to get all audit logs', { error: (error as Error).message });
      throw new AppError('Failed to get audit logs', 500);
    }
  }

  // Dashboard Statistics
  async getDashboardStats(): Promise<DashboardStats> {
    try {
      const [
        totalStudents,
        totalHostels,
        totalBookings,
        totalPayments,
        recentAuditLogs,
        systemHealth
      ] = await Promise.all([
        this.getStudentCount(),
        this.getHostelCount(),
        this.getBookingCount(),
        this.getPaymentCount(),
        this.getRecentAuditLogs(),
        this.getSystemHealth()
      ]);

      return {
        totalStudents,
        totalHostels,
        totalBookings,
        totalPayments,
        recentAuditLogs,
        systemHealth,
        generatedAt: new Date()
      };
    } catch (error) {
      adminLogger.logger.error('Failed to get dashboard stats', { error: (error as Error).message });
      throw new AppError('Failed to get dashboard statistics', 500);
    }
  }

  // Helper methods for statistics
  private async getStudentCount(): Promise<number> {
    try {
      // This would typically call the student service via HTTP or get from cache
      return 0; // Placeholder
    } catch (error) {
      adminLogger.logger.error('Failed to get student count', { error: (error as Error).message });
      return 0;
    }
  }

  private async getHostelCount(): Promise<number> {
    try {
      // This would typically call the hostel service via HTTP or get from cache
      return 0; // Placeholder
    } catch (error) {
      adminLogger.logger.error('Failed to get hostel count', { error: (error as Error).message });
      return 0;
    }
  }

  private async getBookingCount(): Promise<number> {
    try {
      // This would typically call the booking service via HTTP or get from cache
      return 0; // Placeholder
    } catch (error) {
      adminLogger.logger.error('Failed to get booking count', { error: (error as Error).message });
      return 0;
    }
  }

  private async getPaymentCount(): Promise<number> {
    try {
      // This would typically call the payment service via HTTP or get from cache
      return 0; // Placeholder
    } catch (error) {
      adminLogger.logger.error('Failed to get payment count', { error: (error as Error).message });
      return 0;
    }
  }

  private async getRecentAuditLogs(): Promise<AuditLogDocument[]> {
    try {
      return await AuditLog.find()
        .sort({ timestamp: -1 })
        .limit(10);
    } catch (error) {
      adminLogger.logger.error('Failed to get recent audit logs', { error: (error as Error).message });
      return [];
    }
  }

  private async getSystemHealth(): Promise<SystemHealth> {
    try {
      // This would check the health of all microservices
      return {
        status: 'healthy',
        services: {
          auth: 'healthy',
          student: 'healthy',
          hostel: 'healthy',
          booking: 'healthy',
          payment: 'healthy',
          notification: 'healthy'
        },
        lastChecked: new Date()
      };
    } catch (error) {
      adminLogger.logger.error('Failed to get system health', { error: (error as Error).message });
      return { 
        status: 'unhealthy', 
        services: {
          auth: 'unhealthy',
          student: 'unhealthy',
          hostel: 'unhealthy',
          booking: 'unhealthy',
          payment: 'unhealthy',
          notification: 'unhealthy'
        },
        lastChecked: new Date(),
        error: (error as Error).message 
      };
    }
  }

  // User Management Methods
  public async getAllUsers(filters: UserFilters & PaginationOptions) {
    try {
      const { page = 1, limit = 10, search, role, isActive } = filters;
      const skip = (page - 1) * limit;

      // Build query
      const query: any = {};
      
      if (search) {
        query.$or = [
          { fullName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ];
      }
      
      if (role) {
        query.role = role;
      }
      
      if (isActive !== undefined) {
        query.isActive = isActive;
      }

      const users = await User.find(query)
        .select('-passwordHash')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await User.countDocuments(query);
      const totalPages = Math.ceil(total / limit);

      return {
        users,
        total,
        page,
        limit,
        totalPages
      };
    } catch (error) {
      adminLogger.logger.error('Failed to get users', { error: (error as Error).message });
      throw new AppError('Failed to retrieve users', 500);
    }
  }

  public async createUser(userData: any) {
    try {
      // Check if user already exists
      const existingUser = await User.findOne({ email: userData.email });
      if (existingUser) {
        throw new AppError('User with this email already exists', 400);
      }

      const user = new User(userData);
      await user.save();

      // Publish event
      await this.publishEvent(EVENT_TYPES.USER_CREATED, {
        userId: user._id,
        email: user.email,
        role: user.role,
        fullName: user.fullName
      });

      adminLogger.logger.info('User created successfully', { userId: user._id, email: user.email });
      return user;
    } catch (error) {
      adminLogger.logger.error('Failed to create user', { error: (error as Error).message });
      throw error;
    }
  }

  public async getUserById(userId: string) {
    try {
      const user = await User.findById(userId).select('-passwordHash');
      if (!user) {
        throw new AppError('User not found', 404);
      }
      return user;
    } catch (error) {
      adminLogger.logger.error('Failed to get user by ID', { userId, error: (error as Error).message });
      throw error;
    }
  }

  public async updateUserRole(userId: string, newRole: string) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new AppError('User not found', 404);
      }

      const oldRole = user.role;
      user.role = newRole as any;
      await user.save();

      // Publish event
      await this.publishEvent(EVENT_TYPES.USER_UPDATED, {
        userId: user._id,
        email: user.email,
        role: user.role,
        fullName: user.fullName,
        changes: { role: { from: oldRole, to: newRole } }
      });

      adminLogger.logger.info('User role updated', { userId, oldRole, newRole });
      return user;
    } catch (error) {
      adminLogger.logger.error('Failed to update user role', { userId, error: (error as Error).message });
      throw error;
    }
  }

  public async updateUserStatus(userId: string, isActive: boolean) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new AppError('User not found', 404);
      }

      const oldStatus = user.isActive;
      user.isActive = isActive;
      await user.save();

      // Publish event
      await this.publishEvent(EVENT_TYPES.USER_UPDATED, {
        userId: user._id,
        email: user.email,
        role: user.role,
        fullName: user.fullName,
        changes: { isActive: { from: oldStatus, to: isActive } }
      });

      adminLogger.logger.info('User status updated', { userId, oldStatus, newStatus: isActive });
      return user;
    } catch (error) {
      adminLogger.logger.error('Failed to update user status', { userId, error: (error as Error).message });
      throw error;
    }
  }

  public async bulkUpdateUserRoles(updates: Array<{ userId: string; role: string }>) {
    try {
      const results = [];
      
      for (const update of updates) {
        try {
          const user = await this.updateUserRole(update.userId, update.role);
          results.push({ userId: update.userId, success: true, user });
        } catch (error) {
          results.push({ 
            userId: update.userId, 
            success: false, 
            error: (error as Error).message 
          });
        }
      }

      const successCount = results.filter(r => r.success).length;
      const failureCount = results.filter(r => !r.success).length;

      adminLogger.logger.info('Bulk role update completed', { 
        total: updates.length, 
        success: successCount, 
        failures: failureCount 
      });

      return {
        results,
        summary: {
          total: updates.length,
          success: successCount,
          failures: failureCount
        }
      };
    } catch (error) {
      adminLogger.logger.error('Failed to bulk update user roles', { error: (error as Error).message });
      throw error;
    }
  }

  public async deleteUser(userId: string) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new AppError('User not found', 404);
      }

      await User.findByIdAndDelete(userId);

      // Publish event
      await this.publishEvent(EVENT_TYPES.USER_DELETED, {
        userId: user._id,
        email: user.email,
        role: user.role,
        fullName: user.fullName
      });

      adminLogger.logger.info('User deleted successfully', { userId, email: user.email });
    } catch (error) {
      adminLogger.logger.error('Failed to delete user', { userId, error: (error as Error).message });
      throw error;
    }
  }

  // Student Management Methods
  async getAllStudents(filters: any = {}, pagination: any = {}) {
    try {
      const { page = 1, limit = 10, search, course, year, isActive } = filters;
      const query: any = { role: 'student' };

      if (search) {
        query.$or = [
          { fullName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { enrollmentNo: { $regex: search, $options: 'i' } }
        ];
      }

      if (course) query.course = course;
      if (year) query.year = year;
      if (isActive !== undefined) query.isActive = isActive;

      const skip = (page - 1) * limit;
      const students = await User.find(query)
        .select('-password')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 });

      const total = await User.countDocuments(query);

      return {
        students,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      adminLogger.logger.error('Failed to get all students', { error: (error as Error).message });
      throw error;
    }
  }

  async createStudent(studentData: any) {
    try {
      adminLogger.logger.info('Creating student', { email: studentData.email });
      
      const student = new User({
        ...studentData,
        role: 'student',
        isActive: true
      });

      await student.save();

      // Publish event
      await this.publishEvent(EVENT_TYPES.USER_CREATED, {
        userId: student._id,
        email: student.email,
        role: student.role,
        fullName: student.fullName
      });

      adminLogger.logger.info('Student created successfully', { studentId: student._id });
      return student;
    } catch (error) {
      adminLogger.logger.error('Failed to create student', { error: (error as Error).message });
      throw error;
    }
  }

  async getStudentById(studentId: string) {
    try {
      const student = await User.findOne({ _id: studentId, role: 'student' }).select('-password');
      return student;
    } catch (error) {
      adminLogger.logger.error('Failed to get student by ID', { studentId, error: (error as Error).message });
      throw error;
    }
  }

  async updateStudent(studentId: string, updateData: any) {
    try {
      adminLogger.logger.info('Updating student', { studentId });
      
      const student = await User.findOneAndUpdate(
        { _id: studentId, role: 'student' },
        updateData,
        { new: true, runValidators: true }
      ).select('-password');

      if (!student) {
        throw new AppError('Student not found', 404);
      }

      // Publish event
      await this.publishEvent(EVENT_TYPES.USER_UPDATED, {
        userId: student._id,
        email: student.email,
        role: student.role,
        fullName: student.fullName
      });

      adminLogger.logger.info('Student updated successfully', { studentId });
      return student;
    } catch (error) {
      adminLogger.logger.error('Failed to update student', { studentId, error: (error as Error).message });
      throw error;
    }
  }

  async updateStudentStatus(studentId: string, isActive: boolean) {
    try {
      adminLogger.logger.info('Updating student status', { studentId, isActive });
      
      const student = await User.findOneAndUpdate(
        { _id: studentId, role: 'student' },
        { isActive },
        { new: true, runValidators: true }
      ).select('-password');

      if (!student) {
        throw new AppError('Student not found', 404);
      }

      adminLogger.logger.info('Student status updated successfully', { studentId });
      return student;
    } catch (error) {
      adminLogger.logger.error('Failed to update student status', { studentId, error: (error as Error).message });
      throw error;
    }
  }

  async deleteStudent(studentId: string) {
    try {
      adminLogger.logger.info('Deleting student', { studentId });
      
      const student = await User.findOne({ _id: studentId, role: 'student' });
      if (!student) {
        throw new AppError('Student not found', 404);
      }

      await User.findByIdAndDelete(studentId);

      // Publish event
      await this.publishEvent(EVENT_TYPES.USER_DELETED, {
        userId: student._id,
        email: student.email,
        role: student.role,
        fullName: student.fullName
      });

      adminLogger.logger.info('Student deleted successfully', { studentId });
    } catch (error) {
      adminLogger.logger.error('Failed to delete student', { studentId, error: (error as Error).message });
      throw error;
    }
  }

  async getStudentByEnrollment(enrollmentNo: string) {
    try {
      const student = await User.findOne({ enrollmentNo, role: 'student' }).select('-password');
      return student;
    } catch (error) {
      adminLogger.logger.error('Failed to get student by enrollment', { enrollmentNo, error: (error as Error).message });
      throw error;
    }
  }

  // Staff Management Methods
  async getAllStaff(filters: any = {}, pagination: any = {}) {
    try {
      const { page = 1, limit = 10, search, department, position, isActive } = filters;
      const query: any = { role: 'staff' };

      if (search) {
        query.$or = [
          { fullName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { employeeId: { $regex: search, $options: 'i' } }
        ];
      }

      if (department) query.department = department;
      if (position) query.position = position;
      if (isActive !== undefined) query.isActive = isActive;

      const skip = (page - 1) * limit;
      const staff = await User.find(query)
        .select('-password')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 });

      const total = await User.countDocuments(query);

      return {
        staff,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      adminLogger.logger.error('Failed to get all staff', { error: (error as Error).message });
      throw error;
    }
  }

  async createStaff(staffData: any) {
    try {
      adminLogger.logger.info('Creating staff', { email: staffData.email });
      
      const staff = new User({
        ...staffData,
        role: 'staff',
        isActive: true
      });

      await staff.save();

      // Publish event
      await this.publishEvent(EVENT_TYPES.USER_CREATED, {
        userId: staff._id,
        email: staff.email,
        role: staff.role,
        fullName: staff.fullName
      });

      adminLogger.logger.info('Staff created successfully', { staffId: staff._id });
      return staff;
    } catch (error) {
      adminLogger.logger.error('Failed to create staff', { error: (error as Error).message });
      throw error;
    }
  }

  async getStaffById(staffId: string) {
    try {
      const staff = await User.findOne({ _id: staffId, role: 'staff' }).select('-password');
      return staff;
    } catch (error) {
      adminLogger.logger.error('Failed to get staff by ID', { staffId, error: (error as Error).message });
      throw error;
    }
  }

  async updateStaff(staffId: string, updateData: any) {
    try {
      adminLogger.logger.info('Updating staff', { staffId });
      
      const staff = await User.findOneAndUpdate(
        { _id: staffId, role: 'staff' },
        updateData,
        { new: true, runValidators: true }
      ).select('-password');

      if (!staff) {
        throw new AppError('Staff not found', 404);
      }

      // Publish event
      await this.publishEvent(EVENT_TYPES.USER_UPDATED, {
        userId: staff._id,
        email: staff.email,
        role: staff.role,
        fullName: staff.fullName
      });

      adminLogger.logger.info('Staff updated successfully', { staffId });
      return staff;
    } catch (error) {
      adminLogger.logger.error('Failed to update staff', { staffId, error: (error as Error).message });
      throw error;
    }
  }

  async updateStaffStatus(staffId: string, isActive: boolean) {
    try {
      adminLogger.logger.info('Updating staff status', { staffId, isActive });
      
      const staff = await User.findOneAndUpdate(
        { _id: staffId, role: 'staff' },
        { isActive },
        { new: true, runValidators: true }
      ).select('-password');

      if (!staff) {
        throw new AppError('Staff not found', 404);
      }

      adminLogger.logger.info('Staff status updated successfully', { staffId });
      return staff;
    } catch (error) {
      adminLogger.logger.error('Failed to update staff status', { staffId, error: (error as Error).message });
      throw error;
    }
  }

  async updateStaffPermissions(staffId: string, permissions: string[]) {
    try {
      adminLogger.logger.info('Updating staff permissions', { staffId });
      
      const staff = await User.findOneAndUpdate(
        { _id: staffId, role: 'staff' },
        { permissions },
        { new: true, runValidators: true }
      ).select('-password');

      if (!staff) {
        throw new AppError('Staff not found', 404);
      }

      adminLogger.logger.info('Staff permissions updated successfully', { staffId });
      return staff;
    } catch (error) {
      adminLogger.logger.error('Failed to update staff permissions', { staffId, error: (error as Error).message });
      throw error;
    }
  }

  async deleteStaff(staffId: string) {
    try {
      adminLogger.logger.info('Deleting staff', { staffId });
      
      const staff = await User.findOne({ _id: staffId, role: 'staff' });
      if (!staff) {
        throw new AppError('Staff not found', 404);
      }

      await User.findByIdAndDelete(staffId);

      // Publish event
      await this.publishEvent(EVENT_TYPES.USER_DELETED, {
        userId: staff._id,
        email: staff.email,
        role: staff.role,
        fullName: staff.fullName
      });

      adminLogger.logger.info('Staff deleted successfully', { staffId });
    } catch (error) {
      adminLogger.logger.error('Failed to delete staff', { staffId, error: (error as Error).message });
      throw error;
    }
  }

  async getStaffByEmployeeId(employeeId: string) {
    try {
      const staff = await User.findOne({ employeeId, role: 'staff' }).select('-password');
      return staff;
    } catch (error) {
      adminLogger.logger.error('Failed to get staff by employee ID', { employeeId, error: (error as Error).message });
      throw error;
    }
  }
}
