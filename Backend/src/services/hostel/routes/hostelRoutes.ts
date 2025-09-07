import { Router } from 'express';
import { hostelController } from '../controllers/HostelController';
import { validateRequest, createHostelSchema, updateHostelSchema, createRoomSchema, updateRoomSchema, createBedSchema, updateBedSchema, paginationSchema, idParamSchema } from '../../../shared/utils/validation';
import { authenticate, requireAdmin, requireStaff } from '../../../shared/middleware/auth';

const router = Router();

// Public health check
router.get('/health', hostelController.health);

// Apply authentication to all routes
router.use(authenticate);

// Hostel Management Routes
router.post('/', requireAdmin, validateRequest(createHostelSchema), hostelController.createHostel);
router.get('/', validateRequest(paginationSchema), hostelController.getHostels);
router.get('/search', hostelController.searchHostels);
router.get('/campus/:campus', hostelController.getHostelsByCampus);
router.get('/amenity/:amenity', hostelController.getHostelsByAmenity);

router.get('/:id', validateRequest(idParamSchema), hostelController.getHostelById);
router.patch('/:id', requireAdmin, validateRequest({ ...idParamSchema, ...updateHostelSchema }), hostelController.updateHostel);

// Room Management Routes
router.post('/rooms', requireStaff, validateRequest(createRoomSchema), hostelController.createRoom);
router.get('/rooms/:id', validateRequest(idParamSchema), hostelController.getRoomById);
router.patch('/rooms/:id', requireStaff, validateRequest({ ...idParamSchema, ...updateRoomSchema }), hostelController.updateRoom);

router.get('/:hostelId/rooms', hostelController.getRoomsByHostel);
router.get('/:hostelId/rooms/available', hostelController.getAvailableRooms);

// Bed Management Routes
router.post('/beds', requireStaff, validateRequest(createBedSchema), hostelController.createBed);
router.get('/beds/:id', validateRequest(idParamSchema), hostelController.getBedById);
router.patch('/beds/:id', requireStaff, validateRequest({ ...idParamSchema, ...updateBedSchema }), hostelController.updateBed);

router.get('/rooms/:roomId/beds', hostelController.getBedsByRoom);
router.get('/rooms/:roomId/beds/available', hostelController.getAvailableBeds);

// Bed Operations
router.post('/beds/:bedId/hold', requireStaff, hostelController.holdBed);
router.post('/beds/:bedId/allocate', requireStaff, hostelController.allocateBed);
router.post('/beds/:bedId/release', requireStaff, hostelController.releaseBed);

// Statistics
router.get('/rooms/:roomId/bed-statistics', requireStaff, hostelController.getBedStatistics);
router.get('/:hostelId/bed-statistics', requireStaff, hostelController.getHostelBedStatistics);

// Maintenance
router.post('/cleanup-expired-holds', requireStaff, hostelController.cleanupExpiredHolds);

export default router;
