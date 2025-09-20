import { Router } from 'express';
import { adminController } from '../controllers/AdminController';
import { 
  validateRequest, 
  idParamSchema,
  paginationSchema
} from '../../../shared/utils/validation';
import { z } from 'zod';
import { authenticate, requireAdmin } from '../../../shared/middleware/auth';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);
router.use(requireAdmin);

// Student Management Routes
router.get('/', validateRequest(paginationSchema), adminController.getAllStudents);
router.post('/', validateRequest(z.object({
  fullName: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  phone: z.string().optional(),
  enrollmentNo: z.string().min(1),
  course: z.string().min(1),
  year: z.string().min(1),
  semester: z.string().min(1),
  address: z.string().optional(),
  emergencyContact: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(['male', 'female', 'other']).optional()
})), adminController.createStudent);
router.get('/:id', validateRequest(idParamSchema), adminController.getStudentById);
router.patch('/:id', validateRequest(z.object({
  fullName: z.string().min(1).optional(),
  phone: z.string().optional(),
  course: z.string().min(1).optional(),
  year: z.string().min(1).optional(),
  semester: z.string().min(1).optional(),
  address: z.string().optional(),
  emergencyContact: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  isActive: z.boolean().optional()
})), adminController.updateStudent);
router.patch('/:id/status', validateRequest(z.object({ isActive: z.boolean() })), adminController.updateStudentStatus);
router.delete('/:id', validateRequest(idParamSchema), adminController.deleteStudent);
router.get('/enrollment/:enrollmentNo', validateRequest(z.object({ enrollmentNo: z.string() })), adminController.getStudentByEnrollment);

export default router;
