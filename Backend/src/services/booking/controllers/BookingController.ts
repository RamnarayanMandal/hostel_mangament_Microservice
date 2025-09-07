import { Request, Response } from 'express';
import { bookingService } from '../services/BookingService';
import { validateRequest, createBookingSchema, updateBookingSchema, paginationSchema, idParamSchema } from '../../../shared/utils/validation';
import { authenticate, requireAdmin, requireStaff } from '../../../shared/middleware/auth';
import { asyncHandler, successResponse, errorResponse } from '../../../shared/utils/errors';
import { bookingLogger } from '../../../shared/utils/logger';

export class BookingController {
  public createBooking = asyncHandler(async (req: Request, res: Response) => {
    const booking = await bookingService.createBooking(req.validatedData, req.user!.id);
    res.status(201).json(successResponse('Booking created successfully', booking));
  });

  public getBookingById = asyncHandler(async (req: Request, res: Response) => {
    const booking = await bookingService.getBookingById(req.validatedData.id);
    res.json(successResponse('Booking retrieved successfully', booking));
  });

  public updateBooking = asyncHandler(async (req: Request, res: Response) => {
    const booking = await bookingService.updateBooking(req.validatedData.id, req.validatedData, req.user!.id);
    res.json(successResponse('Booking updated successfully', booking));
  });

  public getBookings = asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, ...filters } = req.validatedData;
    const result = await bookingService.getBookings(page, limit, filters);
    res.json(successResponse('Bookings retrieved successfully', result));
  });

  public getBookingsByStudent = asyncHandler(async (req: Request, res: Response) => {
    const bookings = await bookingService.getBookingsByStudent(req.params.studentId);
    res.json(successResponse('Student bookings retrieved successfully', bookings));
  });

  public getBookingsByHostel = asyncHandler(async (req: Request, res: Response) => {
    const bookings = await bookingService.getBookingsByHostel(req.params.hostelId);
    res.json(successResponse('Hostel bookings retrieved successfully', bookings));
  });

  public cancelBooking = asyncHandler(async (req: Request, res: Response) => {
    const { reason } = req.body;
    const booking = await bookingService.cancelBooking(req.params.id, reason, req.user!.id);
    res.json(successResponse('Booking cancelled successfully', booking));
  });

  public checkIn = asyncHandler(async (req: Request, res: Response) => {
    const { roomCondition, notes } = req.body;
    const booking = await bookingService.checkIn(req.params.id, { roomCondition, notes }, req.user!.id);
    res.json(successResponse('Booking checked in successfully', booking));
  });

  public checkOut = asyncHandler(async (req: Request, res: Response) => {
    const { roomCondition, damages, notes } = req.body;
    const booking = await bookingService.checkOut(req.params.id, { roomCondition, damages, notes }, req.user!.id);
    res.json(successResponse('Booking checked out successfully', booking));
  });

  public addPayment = asyncHandler(async (req: Request, res: Response) => {
    const { amount, paymentMethod, status, transactionId } = req.body;
    const booking = await bookingService.addPayment(req.params.id, {
      amount,
      paymentMethod,
      status,
      transactionId,
      paymentDate: new Date()
    });
    res.json(successResponse('Payment added successfully', booking));
  });

  public addSpecialRequest = asyncHandler(async (req: Request, res: Response) => {
    const { type, description } = req.body;
    const booking = await bookingService.addSpecialRequest(req.params.id, { type, description }, req.user!.id);
    res.json(successResponse('Special request added successfully', booking));
  });

  public updateSpecialRequest = asyncHandler(async (req: Request, res: Response) => {
    const { status, comments } = req.body;
    const booking = await bookingService.updateSpecialRequest(
      req.params.id,
      parseInt(req.params.requestIndex),
      { status, comments },
      req.user!.id
    );
    res.json(successResponse('Special request updated successfully', booking));
  });

  public addDocument = asyncHandler(async (req: Request, res: Response) => {
    const { type, fileName, fileUrl } = req.body;
    const booking = await bookingService.addDocument(req.params.id, { type, fileName, fileUrl }, req.user!.id);
    res.json(successResponse('Document added successfully', booking));
  });

  public verifyDocument = asyncHandler(async (req: Request, res: Response) => {
    const booking = await bookingService.verifyDocument(
      req.params.id,
      parseInt(req.params.documentIndex),
      req.user!.id
    );
    res.json(successResponse('Document verified successfully', booking));
  });

  public acceptTerms = asyncHandler(async (req: Request, res: Response) => {
    const booking = await bookingService.acceptTerms(req.params.id, req.user!.id);
    res.json(successResponse('Terms accepted successfully', booking));
  });

  public getBookingStatistics = asyncHandler(async (req: Request, res: Response) => {
    const stats = await bookingService.getBookingStatistics();
    res.json(successResponse('Booking statistics retrieved successfully', stats));
  });

  public getOverdueBookings = asyncHandler(async (req: Request, res: Response) => {
    const bookings = await bookingService.getOverdueBookings();
    res.json(successResponse('Overdue bookings retrieved successfully', bookings));
  });

  public getExpiredBookings = asyncHandler(async (req: Request, res: Response) => {
    const bookings = await bookingService.getExpiredBookings();
    res.json(successResponse('Expired bookings retrieved successfully', bookings));
  });

  public health = asyncHandler(async (req: Request, res: Response) => {
    res.json(successResponse('Booking service is healthy', {
      service: 'booking',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    }));
  });
}

export const bookingController = new BookingController();
