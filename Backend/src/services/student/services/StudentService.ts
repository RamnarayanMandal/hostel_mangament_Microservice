import { Student, StudentDocument } from '../models/Student';
import { 
  CreateStudentInput, 
  UpdateStudentInput 
} from '../../../shared/utils/validation';
import { 
  ConflictError, 
  NotFoundError, 
  ValidationError 
} from '../../../shared/utils/errors';
import { getMessageBroker, EVENT_TYPES } from '../../../shared/config/message-broker';
import { studentLogger } from '../../../shared/utils/logger';
import { v4 as uuidv4 } from 'uuid';

export class StudentService {
  private messageBroker = getMessageBroker();

  /**
   * Create a new student profile
   */
  public async createStudent(studentData: CreateStudentInput): Promise<StudentDocument> {
    try {
      // Check if student already exists
      const existingStudent = await Student.findByUserId(studentData.userId);
      if (existingStudent) {
        throw new ConflictError('Student profile already exists for this user');
      }

      // Check if enrollment number is already taken
      const existingEnrollment = await Student.findByEnrollmentNo(studentData.enrollmentNo);
      if (existingEnrollment) {
        throw new ConflictError('Enrollment number already exists');
      }

      // Create student
      const student = new Student(studentData);
      await student.save();

      // Publish student created event
      await this.messageBroker.publishEvent({
        id: uuidv4(),
        type: EVENT_TYPES.STUDENT_CREATED,
        service: 'student-service',
        data: {
          studentId: student._id,
          userId: student.userId,
          enrollmentNo: student.enrollmentNo,
          year: student.year,
          category: student.category,
          seniorityScore: student.seniorityScore,
        },
        timestamp: new Date(),
      });

      studentLogger.logger.info('Student profile created successfully', { 
        studentId: student._id, 
        enrollmentNo: student.enrollmentNo 
      });
      
      return student;
    } catch (error) {
      studentLogger.logger.error('Failed to create student profile', { 
        error: (error as Error).message, 
        userId: studentData.userId 
      });
      throw error;
    }
  }

  /**
   * Get student by ID
   */
  public async getStudentById(studentId: string, includeSensitiveData: boolean = false): Promise<StudentDocument> {
    try {
      let student = await Student.findById(studentId).populate('userId', 'email fullName role');
      
      if (!student) {
        throw new NotFoundError('Student');
      }

      if (includeSensitiveData) {
        student = (student as any).withSensitiveData();
      }

      return student as StudentDocument;
    } catch (error) {
      studentLogger.logger.error('Failed to get student by ID', { error: (error as Error).message, studentId });
      throw error;
    }
  }

  /**
   * Get student by user ID
   */
  public async getStudentByUserId(userId: string, includeSensitiveData: boolean = false): Promise<StudentDocument> {
    try {
      let student = await Student.findByUserId(userId);
      
      if (!student) {
        throw new NotFoundError('Student');
      }

      if (includeSensitiveData) {
        student = student.withSensitiveData();
      }

      return student;
    } catch (error) {
      studentLogger.logger.error('Failed to get student by user ID', { error: (error as Error).message, userId });
      throw error;
    }
  }

  /**
   * Get student by enrollment number
   */
  public async getStudentByEnrollmentNo(enrollmentNo: string, includeSensitiveData: boolean = false): Promise<StudentDocument> {
    try {
      let student = await Student.findByEnrollmentNo(enrollmentNo);
      
      if (!student) {
        throw new NotFoundError('Student');
      }

      if (includeSensitiveData) {
        student = student.withSensitiveData();
      }

      return student;
    } catch (error) {
      studentLogger.logger.error('Failed to get student by enrollment number', { 
        error: (error as Error).message, 
        enrollmentNo 
      });
      throw error;
    }
  }   

  /**
   * Update student profile
   */
  public async updateStudent(studentId: string, updateData: UpdateStudentInput): Promise<StudentDocument> {
    try {
      const student = await Student.findByIdAndUpdate(
        studentId,
        { $set: updateData },
        { new: true, runValidators: true }
      ).populate('userId', 'email fullName role');

      if (!student) {
        throw new NotFoundError('Student');
      }

      // Update seniority score if year changed
      if (updateData.year) {
        await student.updateSeniorityScore();
      }

      // Publish student updated event
      await this.messageBroker.publishEvent({
        id: uuidv4(),
        type: EVENT_TYPES.STUDENT_UPDATED,
        service: 'student-service',
        data: {
          studentId: student._id,
          userId: student.userId,
          enrollmentNo: student.enrollmentNo,
          year: student.year,
          category: student.category,
          seniorityScore: student.seniorityScore,
        },
        timestamp: new Date(),
      });

      studentLogger.logger.info('Student profile updated successfully', { studentId: student._id });
      return student;
    } catch (error) {
      studentLogger.logger.error('Failed to update student profile', { error: error.message, studentId });
      throw error;
    }
  }

  /**
   * Get all students with pagination and filters
   */
  public async getStudents(page: number = 1, limit: number = 10, filters: any = {}): Promise<{
    students: StudentDocument[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      const skip = (page - 1) * limit;
      
      // Build query
      const query: any = {};
      if (filters.year) query.year = filters.year;
      if (filters.program) query.program = { $regex: filters.program, $options: 'i' };
      if (filters.kycStatus) query.kycStatus = filters.kycStatus;
      if (filters.category) query.category = filters.category;
      if (filters.domicileState) query.domicileState = { $regex: filters.domicileState, $options: 'i' };
      if (filters.search) {
        query.$or = [
          { enrollmentNo: { $regex: filters.search, $options: 'i' } },
          { program: { $regex: filters.search, $options: 'i' } },
        ];
      }

      const [students, total] = await Promise.all([
        Student.find(query)
          .populate('userId', 'email fullName role')
          .sort({ seniorityScore: -1, createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        Student.countDocuments(query),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        students,
        total,
        page,
        limit,
        totalPages,
      };
    } catch (error) {
      studentLogger.logger.error('Failed to get students', { error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Verify student KYC
   */
  public async verifyKyc(studentId: string, verifiedBy: string): Promise<StudentDocument> {
    try {
      const student = await Student.findById(studentId);
      if (!student) {
        throw new NotFoundError('Student');
      }

      await student.verifyKyc(verifiedBy);

      studentLogger.logger.info('Student KYC verified successfully', { 
        studentId: student._id, 
        verifiedBy 
      });
      
      return student;
    } catch (error) {
      studentLogger.logger.error('Failed to verify student KYC', { error: (error as Error).message, studentId });
      throw error;
    }
  }

  /**
   * Reject student KYC
   */
  public async rejectKyc(studentId: string, reason?: string): Promise<StudentDocument> {
    try {
      const student = await Student.findById(studentId);
      if (!student) {
        throw new NotFoundError('Student');
      }

      await student.rejectKyc(reason);

      studentLogger.logger.info('Student KYC rejected', { 
        studentId: student._id, 
        reason 
      });
      
      return student;
    } catch (error) {
      studentLogger.logger.error('Failed to reject student KYC', { error: (error as Error).message, studentId });
      throw error;
    }
  }

  /**
   * Add document to student
   */
  public async addDocument(studentId: string, documentData: any): Promise<StudentDocument> {
    try {
      const student = await Student.findById(studentId);
      if (!student) {
        throw new NotFoundError('Student');
      }

      await student.addDocument(documentData);

      studentLogger.logger.info('Document added to student successfully', { 
        studentId: student._id, 
        documentType: documentData.type 
      });
      
      return student;
    } catch (error) {
      studentLogger.logger.error('Failed to add document to student', { error: error.message, studentId });
      throw error;
    }
  }

  /**
   * Verify student document
   */
  public async verifyDocument(studentId: string, documentIndex: number, verifiedBy: string): Promise<StudentDocument> {
    try {
      const student = await Student.findById(studentId);
      if (!student) {
        throw new NotFoundError('Student');
      }

      if (!student.documents[documentIndex]) {
        throw new ValidationError('Document not found at specified index');
      }

      await student.verifyDocument(documentIndex, verifiedBy);

      studentLogger.logger.info('Student document verified successfully', { 
        studentId: student._id, 
        documentIndex, 
        verifiedBy 
      });
      
      return student;
    } catch (error) {
      studentLogger.logger.error('Failed to verify student document', { error: (error as Error).message, studentId });
      throw error;
    }
  }

  /**
   * Get students eligible for allocation based on criteria
   */
  public async getEligibleStudents(criteria: any): Promise<StudentDocument[]> {
    try {
      const students = await Student.findEligibleForAllocation(criteria);
      await Student.populate(students, { path: 'userId', select: 'email fullName role' });

      studentLogger.logger.info('Retrieved eligible students for allocation', { 
        count: students.length, 
        criteria 
      });
      
      return students;
    } catch (error) {
      studentLogger.logger.error('Failed to get eligible students', { error: error.message, criteria });
      throw error;
    }
  }

  /**
   * Get students by year
   */
  public async getStudentsByYear(year: number): Promise<StudentDocument[]> {
    try {
      const students = await Student.findByYear(year);
      await Student.populate(students, { path: 'userId', select: 'email fullName role' });

      return students;
    } catch (error) {
      studentLogger.logger.error('Failed to get students by year', { error: error.message, year });
      throw error;
    }
  }

  /**
   * Get students by category
   */
  public async getStudentsByCategory(category: string): Promise<StudentDocument[]> {
    try {
      const students = await Student.findByCategory(category);
      await Student.populate(students, { path: 'userId', select: 'email fullName role' });

      return students;
    } catch (error) {
      studentLogger.logger.error('Failed to get students by category', { error: error.message, category });
      throw error;
    }
  }

  /**
   * Get students by KYC status
   */
  public async getStudentsByKycStatus(kycStatus: string): Promise<StudentDocument[]> {
    try {
      const students = await Student.findByKycStatus(kycStatus);
      await Student.populate(students, { path: 'userId', select: 'email fullName role' });

      return students;
    } catch (error) {
      studentLogger.logger.error('Failed to get students by KYC status', { error: (error as Error).message, kycStatus });
      throw error;
    }
  }

  /**
   * Update seniority scores for all students
   */
  public async updateAllSeniorityScores(): Promise<void> {
    try {
      const students = await Student.find({});
      
      for (const student of students) {
        await student.updateSeniorityScore();
      }

      studentLogger.logger.info('Updated seniority scores for all students', { count: students.length });
    } catch (error) {
      studentLogger.logger.error('Failed to update seniority scores', { error: error.message });
      throw error;
    }
  }

  /**
   * Get student statistics
   */
  public async getStudentStatistics(): Promise<any> {
    try {
      const [
        totalStudents,
        verifiedStudents,
        pendingStudents,
        rejectedStudents,
        studentsByYear,
        studentsByCategory,
      ] = await Promise.all([
        Student.countDocuments(),
        Student.countDocuments({ kycStatus: 'VERIFIED' }),
        Student.countDocuments({ kycStatus: 'PENDING' }),
        Student.countDocuments({ kycStatus: 'REJECTED' }),
        Student.aggregate([
          { $group: { _id: '$year', count: { $sum: 1 } } },
          { $sort: { _id: 1 } },
        ]),
        Student.aggregate([
          { $group: { _id: '$category', count: { $sum: 1 } } },
          { $sort: { _id: 1 } },
        ]),
      ]);

      return {
        totalStudents,
        verifiedStudents,
        pendingStudents,
        rejectedStudents,
        studentsByYear,
        studentsByCategory,
      };
    } catch (error) {
      studentLogger.logger.error('Failed to get student statistics', { error: error.message });
      throw error;
    }
  }
}

export const studentService = new StudentService();
