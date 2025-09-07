import { Router } from 'express';
import { bookingController } from '../controllers/BookingController';
import { validateRequest, createBookingSchema, updateBookingSchema, paginationSchema, idParamSchema } from '../../../shared/utils/validation';
import { authenticate, requireAdmin, requireStaff } from '../../../shared/middleware/auth';

const router = Router();

// Public health check
router.get('/health', bookingController.health);

// Apply authentication to all routes
router.use(authenticate);

// Booking Management Routes
router.post('/bookings', validateRequest(createBookingSchema), bookingController.createBooking);
router.get('/bookings', validateRequest(paginationSchema), bookingController.getBookings);
router.get('/bookings/:id', validateRequest(idParamSchema), bookingController.getBookingById);
router.patch('/bookings/:id', validateRequest({ ...idParamSchema, ...updateBookingSchema }), bookingController.updateBooking);

// Booking by Student/Hostel Routes
router.get('/bookings/student/:studentId', bookingController.getBookingsByStudent);
router.get('/bookings/hostel/:hostelId', bookingController.getBookingsByHostel);

// Booking Status Management Routes
router.post('/bookings/:id/cancel', validateRequest(idParamSchema), bookingController.cancelBooking);
router.post('/bookings/:id/check-in', validateRequest(idParamSchema), bookingController.checkIn);
router.post('/bookings/:id/check-out', validateRequest(idParamSchema), bookingController.checkOut);

// Payment Management Routes
router.post('/bookings/:id/payments', validateRequest(idParamSchema), bookingController.addPayment);

// Special Requests Routes
router.post('/bookings/:id/special-requests', validateRequest(idParamSchema), bookingController.addSpecialRequest);
router.patch('/bookings/:id/special-requests/:requestIndex', validateRequest(idParamSchema), bookingController.updateSpecialRequest);

// Document Management Routes
router.post('/bookings/:id/documents', validateRequest(idParamSchema), bookingController.addDocument);
router.post('/bookings/:id/documents/:documentIndex/verify', validateRequest(idParamSchema), bookingController.verifyDocument);

// Terms and Conditions Routes
router.post('/bookings/:id/accept-terms', validateRequest(idParamSchema), bookingController.acceptTerms);

// Analytics and Reporting Routes (Admin/Staff only)
router.get('/statistics', requireAdmin, bookingController.getBookingStatistics);
router.get('/overdue', requireStaff, bookingController.getOverdueBookings);
router.get('/expired', requireStaff, bookingController.getExpiredBookings);

export default router;
