import { Router } from 'express';
import { pricingController } from '../controllers/PricingController';
import { validateRequest, createFeePolicySchema, updateFeePolicySchema, paginationSchema, idParamSchema } from '../../../shared/utils/validation';
import { authenticate, requireAdmin, requireStaff } from '../../../shared/middleware/auth';

const router = Router();

// Public health check
router.get('/health', pricingController.health);

// Apply authentication to all routes
router.use(authenticate);

// Fee Policy Management Routes
router.post('/policies', requireAdmin, validateRequest(createFeePolicySchema), pricingController.createFeePolicy);
router.get('/policies', validateRequest(paginationSchema), pricingController.getFeePolicies);
router.get('/policies/active', pricingController.getActiveFeePolicies);
router.get('/policies/hostel/:hostelId', pricingController.getPoliciesForHostel);
router.get('/policies/hostel/:hostelId/room-type/:roomType', pricingController.getPoliciesForRoomType);

router.get('/policies/:id', validateRequest(idParamSchema), pricingController.getFeePolicyById);
router.patch('/policies/:id', requireAdmin, validateRequest({ ...idParamSchema, ...updateFeePolicySchema }), pricingController.updateFeePolicy);

// Fee Calculation Routes
router.post('/calculate/:hostelId/:roomType', pricingController.calculateFee);
router.post('/calculate/:hostelId/multiple-rooms', pricingController.calculateFeeForMultipleRooms);
router.post('/policies/:policyId/late-fee', pricingController.calculateLateFee);
router.post('/policies/:policyId/refund', pricingController.calculateRefund);

// Adjustment Management Routes
router.post('/policies/:policyId/adjustments', requireAdmin, validateRequest(idParamSchema), pricingController.addAdjustment);
router.patch('/policies/:policyId/adjustments/:adjustmentIndex', requireAdmin, validateRequest(idParamSchema), pricingController.updateAdjustment);
router.delete('/policies/:policyId/adjustments/:adjustmentIndex', requireAdmin, validateRequest(idParamSchema), pricingController.removeAdjustment);

// Bulk Operations Routes
router.post('/policies/bulk-update', requireAdmin, pricingController.bulkUpdatePolicies);

// Statistics and Analytics Routes
router.get('/statistics', requireAdmin, pricingController.getPricingStatistics);
router.post('/comparison/:hostelId', pricingController.getFeeComparison);

// Policy Validation Routes
router.post('/validate', requireAdmin, pricingController.validatePolicy);

export default router;
