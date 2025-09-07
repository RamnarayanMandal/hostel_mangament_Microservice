import { Router } from 'express';
import { gatewayController } from '../controllers/GatewayController';
import { 
  validateRequest, 
  updateServiceHealthSchema,
  gatewayStatsSchema,
  idParamSchema 
} from '../../../shared/utils/validation';
import { authenticate, requireStaff } from '../../../shared/middleware/auth';

const router = Router();

// Public health check
router.get('/health', gatewayController.health);

// Apply authentication to all other routes
router.use(authenticate);

// Service Health Management
router.get('/health/services/:serviceName', validateRequest(idParamSchema), requireStaff, gatewayController.getServiceHealth);
router.patch('/health/services/:serviceName', validateRequest(updateServiceHealthSchema), requireStaff, gatewayController.updateServiceHealth);

// Statistics (Admin/Staff only)
router.get('/statistics', validateRequest(gatewayStatsSchema), requireStaff, gatewayController.getGatewayStatistics);

export default router;
