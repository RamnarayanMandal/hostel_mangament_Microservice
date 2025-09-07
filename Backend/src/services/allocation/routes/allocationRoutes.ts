import { Router } from 'express';
import { allocationController } from '../controllers/AllocationController';
import { validateRequest, createAllocationRuleSchema, updateAllocationRuleSchema, createAllocationRequestSchema, updateAllocationRequestSchema, paginationSchema, idParamSchema } from '../../../shared/utils/validation';
import { authenticate, requireAdmin, requireStaff } from '../../../shared/middleware/auth';

const router = Router();

// Public health check
router.get('/health', allocationController.health);

// Apply authentication to all routes
router.use(authenticate);

// Allocation Rule Management Routes
router.post('/rules', requireAdmin, validateRequest(createAllocationRuleSchema), allocationController.createAllocationRule);
router.get('/rules', validateRequest(paginationSchema), allocationController.getAllocationRules);
router.get('/rules/active', allocationController.getActiveAllocationRules);
router.get('/rules/student', allocationController.getRulesForStudent);
router.get('/rules/hostel/:hostelId', allocationController.getRulesForHostel);

router.get('/rules/:id', validateRequest(idParamSchema), allocationController.getAllocationRuleById);
router.patch('/rules/:id', requireAdmin, validateRequest({ ...idParamSchema, ...updateAllocationRuleSchema }), allocationController.updateAllocationRule);

// Allocation Request Management Routes
router.post('/requests', validateRequest(createAllocationRequestSchema), allocationController.createAllocationRequest);
router.get('/requests', requireStaff, validateRequest(paginationSchema), allocationController.getAllocationRequests);
router.get('/requests/pending', requireStaff, allocationController.getPendingRequests);
router.get('/requests/waitlisted', requireStaff, allocationController.getWaitlistedRequests);
router.get('/requests/approved', requireStaff, allocationController.getApprovedRequests);
router.get('/requests/status/:status', requireStaff, allocationController.getRequestsByStatus);
router.get('/requests/student/:studentId', requireStaff, allocationController.getRequestsByStudent);

router.get('/requests/:id', validateRequest(idParamSchema), allocationController.getAllocationRequestById);
router.patch('/requests/:id', requireStaff, validateRequest({ ...idParamSchema, ...updateAllocationRequestSchema }), allocationController.updateAllocationRequest);

// Request Processing Routes
router.post('/requests/:requestId/approve', requireStaff, validateRequest(idParamSchema), allocationController.approveRequest);
router.post('/requests/:requestId/reject', requireStaff, validateRequest(idParamSchema), allocationController.rejectRequest);
router.post('/requests/:requestId/waitlist', requireStaff, validateRequest(idParamSchema), allocationController.waitlistRequest);
router.post('/requests/:requestId/allocate', requireStaff, validateRequest(idParamSchema), allocationController.allocateRequest);
router.post('/requests/:requestId/cancel', validateRequest(idParamSchema), allocationController.cancelRequest);

// Document Management Routes
router.post('/requests/:requestId/documents', requireStaff, validateRequest(idParamSchema), allocationController.addDocument);
router.post('/requests/:requestId/documents/:documentIndex/verify', requireStaff, validateRequest(idParamSchema), allocationController.verifyDocument);

// Allocation Processing Routes
router.post('/process/:ruleId', requireAdmin, validateRequest(idParamSchema), allocationController.processAllocation);

// Statistics Routes
router.get('/statistics', requireAdmin, allocationController.getAllocationStatistics);

export default router;
