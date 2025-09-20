import { Request, Response } from 'express';
import { AdminService } from '../services/AdminService';
import { successResponse, errorResponse } from '../../../shared/utils/errors';

export class AdminController {
  private adminService: AdminService;

  constructor() {
    this.adminService = new AdminService();
  }

  // Admin Management
  public createAdmin = async (req: Request, res: Response) => {
    try {
      const adminData = req.validatedData;
      const admin = await this.adminService.createAdmin(adminData);
      return successResponse(res, admin, 'Admin created successfully');
    } catch (error) {
      return errorResponse(res, 'Failed to create admin', 500);
    }
  };

  public getAdminById = async (req: Request, res: Response) => {
    try {
      const { id } = req.validatedData;
      const admin = await this.adminService.getAdminById(id);
      
      if (!admin) {
        return errorResponse(res, 'Admin not found', 404);
      }
      
      return successResponse(res, admin, 'Admin retrieved successfully');
    } catch (error) {
      return errorResponse(res, 'Failed to get admin', 500);
    }
  };

  public getAdminByEmail = async (req: Request, res: Response) => {
    try {
      const { email } = req.validatedData;
      const admin = await this.adminService.getAdminByEmail(email);
      
      if (!admin) {
        return errorResponse(res, 'Admin not found', 404);
      }
      
      return successResponse(res, admin, 'Admin retrieved successfully');
    } catch (error) {
      return errorResponse(res, 'Failed to get admin', 500);
    }
  };

  public updateAdmin = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updateData = req.validatedData;
      const admin = await this.adminService.updateAdmin(id, updateData);
      
      if (!admin) {
        return errorResponse(res, 'Admin not found', 404);
      }
      
      return successResponse(res, admin, 'Admin updated successfully');
    } catch (error) {
      return errorResponse(res, 'Failed to update admin', 500);
    }
  };

  public deleteAdmin = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const deleted = await this.adminService.deleteAdmin(id);
      
      if (!deleted) {
        return errorResponse(res, 'Admin not found', 404);
      }
      
      return successResponse(res, null, 'Admin deleted successfully');
    } catch (error) {
      return errorResponse(res, 'Failed to delete admin', 500);
    }
  };

  public getAllAdmins = async (req: Request, res: Response) => {
    try {
      const { filters = {}, pagination = {} } = req.validatedData;
      const result = await this.adminService.getAllAdmins(filters, pagination);
      
      return successResponse(res, result, 'Admins retrieved successfully');
    } catch (error) {
      return errorResponse(res, 'Failed to get admins', 500);
    }
  };

  // Report Management
  public createReport = async (req: Request, res: Response) => {
    try {
      const reportData = req.validatedData;
      const report = await this.adminService.createReport(reportData);
      return successResponse(res, report, 'Report created successfully');
    } catch (error) {
      return errorResponse(res, 'Failed to create report', 500);
    }
  };

  public getReportById = async (req: Request, res: Response) => {
    try {
      const { id } = req.validatedData;
      const report = await this.adminService.getReportById(id);
      
      if (!report) {
        return errorResponse(res, 'Report not found', 404);
      }
      
      return successResponse(res, report, 'Report retrieved successfully');
    } catch (error) {
      return errorResponse(res, 'Failed to get report', 500);
    }
  };

  public updateReport = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updateData = req.validatedData;
      const report = await this.adminService.updateReport(id, updateData);
      
      if (!report) {
        return errorResponse(res, 'Report not found', 404);
      }
      
      return successResponse(res, report, 'Report updated successfully');
    } catch (error) {
      return errorResponse(res, 'Failed to update report', 500);
    }
  };

  public deleteReport = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const deleted = await this.adminService.deleteReport(id);
      
      if (!deleted) {
        return errorResponse(res, 'Report not found', 404);
      }
      
      return successResponse(res, null, 'Report deleted successfully');
    } catch (error) {
      return errorResponse(res, 'Failed to delete report', 500);
    }
  };

  public getAllReports = async (req: Request, res: Response) => {
    try {
      const { filters = {}, pagination = {} } = req.validatedData;
      const result = await this.adminService.getAllReports(filters, pagination);
      
      return successResponse(res, result, 'Reports retrieved successfully');
    } catch (error) {
      return errorResponse(res, 'Failed to get reports', 500);
    }
  };

  // Audit Log Management
  public createAuditLog = async (req: Request, res: Response) => {
    try {
      const auditData = req.validatedData;
      const auditLog = await this.adminService.createAuditLog(auditData);
      return successResponse(res, auditLog, 'Audit log created successfully');
    } catch (error) {
      return errorResponse(res, 'Failed to create audit log', 500);
    }
  };

  public getAuditLogById = async (req: Request, res: Response) => {
    try {
      const { id } = req.validatedData;
      const auditLog = await this.adminService.getAuditLogById(id);
      
      if (!auditLog) {
        return errorResponse(res, 'Audit log not found', 404);
      }
      
      return successResponse(res, auditLog, 'Audit log retrieved successfully');
    } catch (error) {
      return errorResponse(res, 'Failed to get audit log', 500);
    }
  };

  public getAllAuditLogs = async (req: Request, res: Response) => {
    try {
      const { filters = {}, pagination = {} } = req.validatedData;
      const result = await this.adminService.getAllAuditLogs(filters, pagination);
      
      return successResponse(res, result, 'Audit logs retrieved successfully');
    } catch (error) {
      return errorResponse(res, 'Failed to get audit logs', 500);
    }
  };

  // Dashboard
  public getDashboardStats = async (req: Request, res: Response) => {
    try {
      const stats = await this.adminService.getDashboardStats();
      return successResponse(res, stats, 'Dashboard statistics retrieved successfully');
    } catch (error) {
      return errorResponse(res, 'Failed to get dashboard statistics', 500);
    }
  };

  // User Management
  public getAllUsers = async (req: Request, res: Response) => {
    try {
      const { page = 1, limit = 10, search, role, isActive } = req.validatedData;
      const users = await this.adminService.getAllUsers({
        page: Number(page),
        limit: Number(limit),
        search: search as string,
        role: role as string,
        isActive: isActive ? isActive === 'true' : undefined
      });
      return successResponse(res, users, 'Users retrieved successfully');
    } catch (error) {
      return errorResponse(res, 'Failed to get users', 500);
    }
  };

  public createUser = async (req: Request, res: Response) => {
    try {
      const userData = req.validatedData;
      const user = await this.adminService.createUser(userData);
      return successResponse(res, user, 'User created successfully');
    } catch (error) {
      return errorResponse(res, 'Failed to create user', 500);
    }
  };

  public getUserById = async (req: Request, res: Response) => {
    try {
      const { id } = req.validatedData;
      const user = await this.adminService.getUserById(id);
      
      if (!user) {
        return errorResponse(res, 'User not found', 404);
      }
      
      return successResponse(res, user, 'User retrieved successfully');
    } catch (error) {
      return errorResponse(res, 'Failed to get user', 500);
    }
  };

  public updateUserRole = async (req: Request, res: Response) => {
    try {
      const { id } = req.validatedData;
      const { role } = req.body;
      const user = await this.adminService.updateUserRole(id, role);
      return successResponse(res, user, 'User role updated successfully');
    } catch (error) {
      return errorResponse(res, 'Failed to update user role', 500);
    }
  };

  public updateUserStatus = async (req: Request, res: Response) => {
    try {
      const { id } = req.validatedData;
      const { isActive } = req.body;
      const user = await this.adminService.updateUserStatus(id, isActive);
      return successResponse(res, user, 'User status updated successfully');
    } catch (error) {
      return errorResponse(res, 'Failed to update user status', 500);
    }
  };

  public bulkUpdateUserRoles = async (req: Request, res: Response) => {
    try {
      const { updates } = req.body;
      const result = await this.adminService.bulkUpdateUserRoles(updates);
      return successResponse(res, result, 'User roles updated successfully');
    } catch (error) {
      return errorResponse(res, 'Failed to update user roles', 500);
    }
  };

  public deleteUser = async (req: Request, res: Response) => {
    try {
      const { id } = req.validatedData;
      await this.adminService.deleteUser(id);
      return successResponse(res, null, 'User deleted successfully');
    } catch (error) {
      return errorResponse(res, 'Failed to delete user', 500);
    }
  };

  // Student Management
  public getAllStudents = async (req: Request, res: Response) => {
    try {
      const { page = 1, limit = 10, search, course, year, isActive } = req.query;
      const students = await this.adminService.getAllStudents({
        page: Number(page),
        limit: Number(limit),
        search: search as string,
        course: course as string,
        year: year as string,
        isActive: isActive ? isActive === 'true' : undefined
      });
      return successResponse(res, students, 'Students retrieved successfully');
    } catch (error) {
      return errorResponse(res, 'Failed to get students', 500);
    }
  };

  public createStudent = async (req: Request, res: Response) => {
    try {
      const studentData = req.validatedData;
      const student = await this.adminService.createStudent(studentData);
      return successResponse(res, student, 'Student created successfully');
    } catch (error) {
      return errorResponse(res, 'Failed to create student', 500);
    }
  };

  public getStudentById = async (req: Request, res: Response) => {
    try {
      const { id } = req.validatedData;
      const student = await this.adminService.getStudentById(id);
      
      if (!student) {
        return errorResponse(res, 'Student not found', 404);
      }
      
      return successResponse(res, student, 'Student retrieved successfully');
    } catch (error) {
      return errorResponse(res, 'Failed to get student', 500);
    }
  };

  public updateStudent = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updateData = req.validatedData;
      const student = await this.adminService.updateStudent(id, updateData);
      
      if (!student) {
        return errorResponse(res, 'Student not found', 404);
      }
      
      return successResponse(res, student, 'Student updated successfully');
    } catch (error) {
      return errorResponse(res, 'Failed to update student', 500);
    }
  };

  public updateStudentStatus = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { isActive } = req.validatedData;
      const student = await this.adminService.updateStudentStatus(id, isActive);
      
      if (!student) {
        return errorResponse(res, 'Student not found', 404);
      }
      
      return successResponse(res, student, 'Student status updated successfully');
    } catch (error) {
      return errorResponse(res, 'Failed to update student status', 500);
    }
  };

  public deleteStudent = async (req: Request, res: Response) => {
    try {
      const { id } = req.validatedData;
      await this.adminService.deleteStudent(id);
      return successResponse(res, null, 'Student deleted successfully');
    } catch (error) {
      return errorResponse(res, 'Failed to delete student', 500);
    }
  };

  public getStudentByEnrollment = async (req: Request, res: Response) => {
    try {
      const { enrollmentNo } = req.validatedData;
      const student = await this.adminService.getStudentByEnrollment(enrollmentNo);
      
      if (!student) {
        return errorResponse(res, 'Student not found', 404);
      }
      
      return successResponse(res, student, 'Student retrieved successfully');
    } catch (error) {
      return errorResponse(res, 'Failed to get student', 500);
    }
  };

  // Staff Management
  public getAllStaff = async (req: Request, res: Response) => {
    try {
      const { page = 1, limit = 10, search, department, position, isActive } = req.query;
      const staff = await this.adminService.getAllStaff({
        page: Number(page),
        limit: Number(limit),
        search: search as string,
        department: department as string,
        position: position as string,
        isActive: isActive ? isActive === 'true' : undefined
      });
      return successResponse(res, staff, 'Staff retrieved successfully');
    } catch (error) {
      return errorResponse(res, 'Failed to get staff', 500);
    }
  };

  public createStaff = async (req: Request, res: Response) => {
    try {
      const staffData = req.validatedData;
      const staff = await this.adminService.createStaff(staffData);
      return successResponse(res, staff, 'Staff created successfully');
    } catch (error) {
      return errorResponse(res, 'Failed to create staff', 500);
    }
  };

  public getStaffById = async (req: Request, res: Response) => {
    try {
      const { id } = req.validatedData;
      const staff = await this.adminService.getStaffById(id);
      
      if (!staff) {
        return errorResponse(res, 'Staff not found', 404);
      }
      
      return successResponse(res, staff, 'Staff retrieved successfully');
    } catch (error) {
      return errorResponse(res, 'Failed to get staff', 500);
    }
  };

  public updateStaff = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updateData = req.validatedData;
      const staff = await this.adminService.updateStaff(id, updateData);
      
      if (!staff) {
        return errorResponse(res, 'Staff not found', 404);
      }
      
      return successResponse(res, staff, 'Staff updated successfully');
    } catch (error) {
      return errorResponse(res, 'Failed to update staff', 500);
    }
  };

  public updateStaffStatus = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { isActive } = req.validatedData;
      const staff = await this.adminService.updateStaffStatus(id, isActive);
      
      if (!staff) {
        return errorResponse(res, 'Staff not found', 404);
      }
      
      return successResponse(res, staff, 'Staff status updated successfully');
    } catch (error) {
      return errorResponse(res, 'Failed to update staff status', 500);
    }
  };

  public updateStaffPermissions = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { permissions } = req.validatedData;
      const staff = await this.adminService.updateStaffPermissions(id, permissions);
      
      if (!staff) {
        return errorResponse(res, 'Staff not found', 404);
      }
      
      return successResponse(res, staff, 'Staff permissions updated successfully');
    } catch (error) {
      return errorResponse(res, 'Failed to update staff permissions', 500);
    }
  };

  public deleteStaff = async (req: Request, res: Response) => {
    try {
      const { id } = req.validatedData;
      await this.adminService.deleteStaff(id);
      return successResponse(res, null, 'Staff deleted successfully');
    } catch (error) {
      return errorResponse(res, 'Failed to delete staff', 500);
    }
  };

  public getStaffByEmployeeId = async (req: Request, res: Response) => {
    try {
      const { employeeId } = req.validatedData;
      const staff = await this.adminService.getStaffByEmployeeId(employeeId);
      
      if (!staff) {
        return errorResponse(res, 'Staff not found', 404);
      }
      
      return successResponse(res, staff, 'Staff retrieved successfully');
    } catch (error) {
      return errorResponse(res, 'Failed to get staff', 500);
    }
  };
}

export const adminController = new AdminController();
