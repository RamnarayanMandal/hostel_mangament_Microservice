import { Request, Response } from 'express';
import { studentService } from '../services/StudentService';
import { 
  validateRequest, 
  createStudentSchema, 
  updateStudentSchema,
  paginationSchema,
  idParamSchema 
} from '../../../shared/utils/validation';
import { 
  authenticate, 
  requireAdmin, 
  requireStaff,
  requireSensitiveDataAccess 
} from '../../../shared/middleware/auth';
import { asyncHandler, successResponse, errorResponse } from '../../../shared/utils/errors';
import { studentLogger } from '../../../shared/utils/logger';

export class StudentController {
  /**
   * Create a new student profile
   * POST /students
   */
  public createStudent = asyncHandler(async (req: Request, res: Response) => {
    const studentData = req.validatedData;
    
    const student = await studentService.createStudent(studentData);
    
    return successResponse(res, student, 'Student profile created successfully', 201);
  });

  /**
   * Get student by ID
   * GET /students/:id
   */
  public getStudentById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.validatedData;
    const includeSensitiveData = req.user?.role === 'ADMIN';
    
    const student = await studentService.getStudentById(id, includeSensitiveData);
    
    return successResponse(res, student, 'Student retrieved successfully');
  });

  /**
   * Get student by user ID
   * GET /students/user/:userId
   */
  public getStudentByUserId = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const includeSensitiveData = req.user?.role === 'ADMIN';
    
    const student = await studentService.getStudentByUserId(userId, includeSensitiveData);
    
    return successResponse(res, student, 'Student retrieved successfully');
  });

  /**
   * Get student by enrollment number
   * GET /students/enrollment/:enrollmentNo
   */
  public getStudentByEnrollmentNo = asyncHandler(async (req: Request, res: Response) => {
    const { enrollmentNo } = req.params;
    const includeSensitiveData = req.user?.role === 'ADMIN';
    
    const student = await studentService.getStudentByEnrollmentNo(enrollmentNo, includeSensitiveData);
    
    return successResponse(res, student, 'Student retrieved successfully');
  });

  /**
   * Update student profile
   * PATCH /students/:id
   */
  public updateStudent = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.validatedData;
    const updateData = req.validatedData;
    
    const student = await studentService.updateStudent(id, updateData);
    
    return successResponse(res, student, 'Student profile updated successfully');
  });

  /**
   * Get all students with pagination and filters
   * GET /students
   */
  public getStudents = asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, ...filters } = req.validatedData;
    
    const result = await studentService.getStudents(page, limit, filters);
    
    return successResponse(res, result, 'Students retrieved successfully');
  });

  /**
   * Verify student KYC
   * POST /students/:id/verify-kyc
   */
  public verifyKyc = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.validatedData;
    const verifiedBy = req.user!.userId;
    
    const student = await studentService.verifyKyc(id, verifiedBy);
    
    return successResponse(res, student, 'Student KYC verified successfully');
  });

  /**
   * Reject student KYC
   * POST /students/:id/reject-kyc
   */
  public rejectKyc = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.validatedData;
    const { reason } = req.body;
    
    const student = await studentService.rejectKyc(id, reason);
    
    return successResponse(res, student, 'Student KYC rejected');
  });

  /**
   * Add document to student
   * POST /students/:id/documents
   */
  public addDocument = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.validatedData;
    const documentData = req.body;
    
    const student = await studentService.addDocument(id, documentData);
    
    return successResponse(res, student, 'Document added successfully');
  });

  /**
   * Verify student document
   * POST /students/:id/documents/:documentIndex/verify
   */
  public verifyDocument = asyncHandler(async (req: Request, res: Response) => {
    const { id, documentIndex } = req.params;
    const verifiedBy = req.user!.userId;
    
    const student = await studentService.verifyDocument(id, parseInt(documentIndex), verifiedBy);
    
    return successResponse(res, student, 'Document verified successfully');
  });

  /**
   * Get students eligible for allocation
   * POST /students/eligible
   */
  public getEligibleStudents = asyncHandler(async (req: Request, res: Response) => {
    const criteria = req.body;
    
    const students = await studentService.getEligibleStudents(criteria);
    
    return successResponse(res, students, 'Eligible students retrieved successfully');
  });

  /**
   * Get students by year
   * GET /students/year/:year
   */
  public getStudentsByYear = asyncHandler(async (req: Request, res: Response) => {
    const { year } = req.params;
    
    const students = await studentService.getStudentsByYear(parseInt(year));
    
    return successResponse(res, students, 'Students retrieved successfully');
  });

  /**
   * Get students by category (Admin only)
   * GET /students/category/:category
   */
  public getStudentsByCategory = asyncHandler(async (req: Request, res: Response) => {
    const { category } = req.params;
    
    const students = await studentService.getStudentsByCategory(category);
    
    return successResponse(res, students, 'Students retrieved successfully');
  });

  /**
   * Get students by KYC status
   * GET /students/kyc-status/:status
   */
  public getStudentsByKycStatus = asyncHandler(async (req: Request, res: Response) => {
    const { status } = req.params;
    
    const students = await studentService.getStudentsByKycStatus(status);
    
    return successResponse(res, students, 'Students retrieved successfully');
  });

  /**
   * Update all seniority scores (Admin only)
   * POST /students/update-seniority-scores
   */
  public updateAllSeniorityScores = asyncHandler(async (req: Request, res: Response) => {
    await studentService.updateAllSeniorityScores();
    
    return successResponse(res, null, 'Seniority scores updated successfully');
  });

  /**
   * Get student statistics (Admin only)
   * GET /students/statistics
   */
  public getStudentStatistics = asyncHandler(async (req: Request, res: Response) => {
    const statistics = await studentService.getStudentStatistics();
    
    return successResponse(res, statistics, 'Student statistics retrieved successfully');
  });

  /**
   * Get current user's student profile
   * GET /students/profile
   */
  public getMyProfile = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    
    const student = await studentService.getStudentByUserId(userId);
    
    return successResponse(res, student, 'Profile retrieved successfully');
  });

  /**
   * Update current user's student profile
   * PATCH /students/profile
   */
  public updateMyProfile = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const updateData = req.validatedData;
    
    // Students can only update certain fields
    const allowedFields = ['program', 'semester', 'domicileState'];
    const filteredData: any = {};
    
    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        filteredData[field] = updateData[field];
      }
    }
    
    const student = await studentService.updateStudent(userId, filteredData);
    
    return successResponse(res, student, 'Profile updated successfully');
  });

  /**
   * Health check
   * GET /students/health
   */
  public health = asyncHandler(async (req: Request, res: Response) => {
    return successResponse(res, { status: 'healthy' }, 'Student service is healthy');
  });
}

export const studentController = new StudentController();
