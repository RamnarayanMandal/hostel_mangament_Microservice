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

// Staff Management Routes
router.get('/', validateRequest(paginationSchema), adminController.getAllStaff);
router.post('/', validateRequest(z.object({
  fullName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  employeeId: z.string().min(1),
  department: z.string().min(1),
  position: z.string().min(1),
  salary: z.number().optional(),
  hireDate: z.string().optional(),
  address: z.string().optional(),
  emergencyContact: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  permissions: z.array(z.string()).optional()
})), adminController.createStaff);
router.get('/:id', validateRequest(idParamSchema), adminController.getStaffById);
router.patch('/:id', validateRequest(z.object({
  fullName: z.string().min(1).optional(),
  phone: z.string().optional(),
  department: z.string().min(1).optional(),
  position: z.string().min(1).optional(),
  salary: z.number().optional(),
  address: z.string().optional(),
  emergencyContact: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  permissions: z.array(z.string()).optional(),
  isActive: z.boolean().optional()
})), adminController.updateStaff);
router.patch('/:id/status', validateRequest(z.object({ isActive: z.boolean() })), adminController.updateStaffStatus);
router.patch('/:id/permissions', validateRequest(z.object({ permissions: z.array(z.string()) })), adminController.updateStaffPermissions);
router.delete('/:id', validateRequest(idParamSchema), adminController.deleteStaff);
router.get('/employee/:employeeId', validateRequest(z.object({ employeeId: z.string() })), adminController.getStaffByEmployeeId);

export default router;
