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

// User Management Routes (must come before /:id routes)
router.get('/users', validateRequest(paginationSchema), adminController.getAllUsers);
router.post('/users', validateRequest(createAdminSchema), adminController.createUser);
router.patch('/users/bulk-roles', validateRequest(z.object({ updates: z.array(z.object({ userId: z.string(), role: z.string() })) })), adminController.bulkUpdateUserRoles);
router.get('/users/:id', validateRequest(idParamSchema), adminController.getUserById);
router.patch('/users/:id/role', validateRequest(z.object({ role: z.string() })), adminController.updateUserRole);
router.patch('/users/:id/status', validateRequest(z.object({ isActive: z.boolean() })), adminController.updateUserStatus);
router.delete('/users/:id', validateRequest(idParamSchema), adminController.deleteUser);

// Report Management Routes
router.post('/reports', validateRequest(createReportSchema), adminController.createReport);
router.get('/reports', validateRequest(paginationSchema), adminController.getAllReports);
router.get('/reports/:id', validateRequest(idParamSchema), adminController.getReportById);
router.put('/reports/:id', validateRequest(updateReportSchema), adminController.updateReport);
router.delete('/reports/:id', validateRequest(idParamSchema), adminController.deleteReport);

// Audit Log Management Routes
router.post('/audit-logs', validateRequest(createAuditLogSchema), adminController.createAuditLog);
router.get('/audit-logs', validateRequest(auditLogFiltersSchema), adminController.getAllAuditLogs);
router.get('/audit-logs/:id', validateRequest(idParamSchema), adminController.getAuditLogById);

// Dashboard Routes
router.get('/dashboard/stats', adminController.getDashboardStats);

// Admin Management Routes (must come after specific routes)
router.post('/', validateRequest(createAdminSchema), adminController.createAdmin);
router.get('/search', validateRequest(z.object({ email: z.string().email() })), adminController.getAdminByEmail);
router.get('/', validateRequest(paginationSchema), adminController.getAllAdmins);

// NOTE: The /:id routes are intentionally placed at the very end to avoid conflicts
// with other route patterns like /staff, /students, etc.
// Admin ID-based routes (must come last to avoid conflicts with other routes)
// Using a more specific pattern to avoid conflicts with other routes
router.get('/admin/:id', validateRequest(idParamSchema), adminController.getAdminById);
router.put('/admin/:id', validateRequest(updateAdminSchema), adminController.updateAdmin);
router.delete('/admin/:id', validateRequest(idParamSchema), adminController.deleteAdmin);

export default router;
