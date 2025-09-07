import { Router } from 'express';
import { adminController } from '../controllers/AdminController';
import { 
  validateRequest, 
  idParamSchema,
  paginationSchema,
  createAdminSchema,
  updateAdminSchema,
  createReportSchema,
  updateReportSchema,
  createAuditLogSchema,
  auditLogFiltersSchema
} from '../../../shared/utils/validation';
import { z } from 'zod';
import { authenticate, requireAdmin } from '../../../shared/middleware/auth';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);
router.use(requireAdmin);

// Admin Management Routes
router.post('/', validateRequest(createAdminSchema), adminController.createAdmin);
router.get('/search', validateRequest(z.object({ email: z.string().email() })), adminController.getAdminByEmail);
router.get('/:id', validateRequest(idParamSchema), adminController.getAdminById);
router.put('/:id', validateRequest(updateAdminSchema), adminController.updateAdmin);
router.delete('/:id', validateRequest(idParamSchema), adminController.deleteAdmin);
router.get('/', validateRequest(paginationSchema), adminController.getAllAdmins);

// Report Management Routes
router.post('/reports', validateRequest(createReportSchema), adminController.createReport);
router.get('/reports/:id', validateRequest(idParamSchema), adminController.getReportById);
router.put('/reports/:id', validateRequest(updateReportSchema), adminController.updateReport);
router.delete('/reports/:id', validateRequest(idParamSchema), adminController.deleteReport);
router.get('/reports', validateRequest(paginationSchema), adminController.getAllReports);

// Audit Log Management Routes
router.post('/audit-logs', validateRequest(createAuditLogSchema), adminController.createAuditLog);
router.get('/audit-logs/:id', validateRequest(idParamSchema), adminController.getAuditLogById);
router.get('/audit-logs', validateRequest(auditLogFiltersSchema), adminController.getAllAuditLogs);

// User Management Routes
router.get('/users', validateRequest(paginationSchema), adminController.getAllUsers);
router.post('/users', validateRequest(createAdminSchema), adminController.createUser);
router.get('/users/:id', validateRequest(idParamSchema), adminController.getUserById);
router.patch('/users/:id/role', validateRequest(z.object({ role: z.string() })), adminController.updateUserRole);
router.patch('/users/:id/status', validateRequest(z.object({ isActive: z.boolean() })), adminController.updateUserStatus);
router.patch('/users/bulk-roles', validateRequest(z.object({ updates: z.array(z.object({ userId: z.string(), role: z.string() })) })), adminController.bulkUpdateUserRoles);
router.delete('/users/:id', validateRequest(idParamSchema), adminController.deleteUser);

// Dashboard Routes
router.get('/dashboard/stats', adminController.getDashboardStats);

export default router;
