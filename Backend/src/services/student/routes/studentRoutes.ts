import { Router } from 'express';
import { studentController } from '../controllers/StudentController';
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

const router = Router();

// Public routes
router.get('/health', studentController.health);

// Protected routes
router.use(authenticate);

// Student profile routes (for current user)
router.get('/profile', studentController.getMyProfile);
router.patch('/profile', validateRequest(updateStudentSchema), studentController.updateMyProfile);

// Student management routes (Admin/Staff)
router.post('/', requireStaff, validateRequest(createStudentSchema), studentController.createStudent);
router.get('/', requireStaff, validateRequest(paginationSchema), studentController.getStudents);
router.get('/statistics', requireAdmin, studentController.getStudentStatistics);

// Individual student routes
router.get('/:id', requireStaff, validateRequest(idParamSchema), studentController.getStudentById);
router.patch('/:id', requireStaff, validateRequest({ ...idParamSchema, ...updateStudentSchema }), studentController.updateStudent);

// Student lookup routes
router.get('/user/:userId', requireStaff, studentController.getStudentByUserId);
router.get('/enrollment/:enrollmentNo', requireStaff, studentController.getStudentByEnrollmentNo);

// KYC management routes
router.post('/:id/verify-kyc', requireStaff, validateRequest(idParamSchema), studentController.verifyKyc);
router.post('/:id/reject-kyc', requireStaff, validateRequest(idParamSchema), studentController.rejectKyc);

// Document management routes
router.post('/:id/documents', requireStaff, validateRequest(idParamSchema), studentController.addDocument);
router.post('/:id/documents/:documentIndex/verify', requireStaff, validateRequest(idParamSchema), studentController.verifyDocument);

// Student filtering routes
router.post('/eligible', requireStaff, studentController.getEligibleStudents);
router.get('/year/:year', requireStaff, studentController.getStudentsByYear);
router.get('/category/:category', requireSensitiveDataAccess, studentController.getStudentsByCategory);
router.get('/kyc-status/:status', requireStaff, studentController.getStudentsByKycStatus);

// Admin-only routes
router.post('/update-seniority-scores', requireAdmin, studentController.updateAllSeniorityScores);

export default router;
