import { Booking, BookingDocument } from '../models/Booking';
import { CreateBookingInput, UpdateBookingInput } from '../../../shared/utils/validation';
import { ConflictError, NotFoundError, ValidationError } from '../../../shared/utils/errors';
import { getMessageBroker, EVENT_TYPES } from '../../../shared/config/message-broker';
import { bookingLogger } from '../../../shared/utils/logger';
import { v4 as uuidv4 } from 'uuid';
import mongoose from 'mongoose';

export class BookingService {
  private messageBroker = getMessageBroker();

  public async createBooking(bookingData: CreateBookingInput, createdBy: string): Promise<BookingDocument> {
    try {
      // Check for overlapping bookings
      const overlappingBookings = await (Booking as any).findOverlappingBookings(
        bookingData.bedId!,
        new Date(bookingData.startDate),
        new Date(bookingData.endDate || bookingData.startDate)
      );

      if (overlappingBookings.length > 0) {
        throw new ConflictError('Bed is already booked for the specified dates');
      }

      const booking = new Booking({
        ...bookingData,
        createdBy,
        checkInDate: new Date(bookingData.startDate),
        checkOutDate: new Date(bookingData.endDate || bookingData.startDate),
        duration: this.calculateDuration(bookingData.startDate, bookingData.endDate),
        totalAmount: 0, // Will be calculated by pricing service
        amountDue: 0, // Will be calculated by pricing service
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        terms: {
          accepted: false,
          version: '1.0'
        }
      });

      const savedBooking = await booking.save();

      // Publish booking created event
      await this.messageBroker.publishEvent({
        id: uuidv4(),
        type: EVENT_TYPES.BOOKING_CREATED,
        service: 'booking-service',
        data: {
          bookingId: savedBooking._id,
          studentId: savedBooking.studentId,
          hostelId: savedBooking.hostelId,
          roomId: savedBooking.roomId,
          bedId: savedBooking.bedId,
          checkInDate: savedBooking.checkInAt,
          checkOutDate: savedBooking.checkOutAt
        },
        timestamp: new Date(),
        correlationId: uuidv4()
      });

      bookingLogger.logger.info('Booking created', { bookingId: savedBooking._id, studentId: savedBooking.studentId });
      return savedBooking;
    } catch (error) {
      bookingLogger.logger.error('Failed to create booking', { error, bookingData });
      throw error;
    }
  }

  public async getBookingById(bookingId: string): Promise<BookingDocument> {
    const booking = await Booking.findById(bookingId)
      .populate('studentId', 'fullName enrollmentNo')
      .populate('hostelId', 'name campus')
      .populate('roomId', 'number type')
      .populate('bedId', 'bedNo')
      .populate('feePolicyId', 'name baseMonthlyFee');

    if (!booking) {
      throw new NotFoundError('Booking not found');
    }

    return booking;
  }

  public async updateBooking(bookingId: string, updateData: UpdateBookingInput, updatedBy: string): Promise<BookingDocument> {
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      throw new NotFoundError('Booking not found');
    }

    // Check if booking can be updated
    if (booking.status === 'CHECKED_OUT' || booking.status === 'CANCELLED') {
      throw new ValidationError('Cannot update completed or cancelled booking');
    }

    // If dates are being updated, check for overlaps
    if (updateData.startDate || updateData.endDate) {
      const newCheckIn = updateData.startDate ? new Date(updateData.startDate) : booking.checkInAt;
      const newCheckOut = updateData.endDate ? new Date(updateData.endDate) : booking.checkOutAt;

      const overlappingBookings = await (Booking as any).findOverlappingBookings(
        booking.bedId?.toString() || '',
        newCheckIn,
        newCheckOut,
        bookingId
      );

      if (overlappingBookings.length > 0) {
        throw new ConflictError('Bed is already booked for the specified dates');
      }
    }

    // Update booking
    Object.assign(booking, updateData, { updatedBy });

    if (updateData.startDate || updateData.endDate) {
      booking.checkInAt = updateData.startDate ? new Date(updateData.startDate) : booking.checkInAt;
      booking.checkOutAt = updateData.endDate ? new Date(updateData.endDate) : booking.checkOutAt;
      booking.duration = this.calculateDuration(booking.checkInAt!, booking.checkOutAt!);
    }

    const updatedBooking = await booking.save();

    // Publish booking updated event
    await this.messageBroker.publishEvent({
      id: uuidv4(),
      type: EVENT_TYPES.BOOKING_CONFIRMED,
      service: 'booking-service',
      data: {
        bookingId: updatedBooking._id,
        status: updatedBooking.status,
        checkInDate: updatedBooking.checkInAt,
        checkOutDate: updatedBooking.checkOutAt,
      },
      timestamp: new Date(),
      correlationId: uuidv4()
    });

    bookingLogger.logger.info('Booking updated', { bookingId: updatedBooking._id, status: updatedBooking.status });
    return updatedBooking;
  }

  public async getBookings(page: number = 1, limit: number = 10, filters: any = {}): Promise<{
    bookings: BookingDocument[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const query: any = {};

    // Apply filters
    if (filters.studentId) query.studentId = filters.studentId;
    if (filters.hostelId) query.hostelId = filters.hostelId;
    if (filters.status) query.status = filters.status;
    if (filters.paymentStatus) query.paymentStatus = filters.paymentStatus;
    if (filters.checkInDate) {
      query.checkInDate = { $gte: new Date(filters.checkInDate) };
    }
    if (filters.checkOutDate) {
      query.checkOutDate = { $lte: new Date(filters.checkOutDate) };
    }

    const skip = (page - 1) * limit;
    const [bookings, total] = await Promise.all([
      Booking.find(query)
        .populate('studentId', 'fullName enrollmentNo')
        .populate('hostelId', 'name campus')
        .populate('roomId', 'number type')
        .populate('bedId', 'bedNo')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Booking.countDocuments(query)
    ]);

    return {
      bookings,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  public async getBookingsByStudent(studentId: string): Promise<BookingDocument[]> {
    return Booking.find({ studentId })
      .populate('hostelId', 'name campus')
      .populate('roomId', 'number type')
      .populate('bedId', 'bedNo')
      .sort({ createdAt: -1 });
  }

  public async getBookingsByHostel(hostelId: string): Promise<BookingDocument[]> {
    return Booking.find({ hostelId })
      .populate('studentId', 'fullName enrollmentNo')
      .populate('roomId', 'number type')
      .populate('bedId', 'bedNo')
      .sort({ createdAt: -1 });
  }

  public async cancelBooking(bookingId: string, reason: string, cancelledBy: string): Promise<BookingDocument> {
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      throw new NotFoundError('Booking not found');
    }

    if (!(booking as any).canBeCancelled()) {
      throw new ValidationError('Booking cannot be cancelled in its current state');
    }

    await (booking as any).requestCancellation(reason, cancelledBy);

    // Publish booking cancelled event
    await this.messageBroker.publishEvent({
      id: uuidv4(),
      type: EVENT_TYPES.BOOKING_CANCELLED,
      service: 'booking-service',
             data: {
         bookingId: booking._id,
         reason: (booking as any).cancellation.reason,
         refundAmount: (booking as any).cancellation.refundAmount
       },
      timestamp: new Date(),
      correlationId: uuidv4()
    });

    bookingLogger.logger.info('Booking cancelled', { bookingId: booking._id, reason });
    return booking;
  }

  public async checkIn(bookingId: string, checkInData: any, checkedInBy: string): Promise<BookingDocument> {
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      throw new NotFoundError('Booking not found');
    }

    if (!(booking as any).canCheckIn()) {
      throw new ValidationError('Booking cannot be checked in. Payment must be completed and status must be confirmed.');
    }

    await (booking as any).checkIn({
      ...checkInData,
      checkedInBy
    });

    // Publish check-in event
    await this.messageBroker.publishEvent({
      id: uuidv4(),
      type: EVENT_TYPES.BOOKING_CHECKED_IN,
      service: 'booking-service',
      data: {
        bookingId: booking._id,
        checkedInAt: booking.checkIn!.checkedInAt
      },
      timestamp: new Date(),
      correlationId: uuidv4()
    });

    bookingLogger.logger.info('Booking checked in', { bookingId: booking._id });
    return booking;
  }

  public async checkOut(bookingId: string, checkOutData: any, checkedOutBy: string): Promise<BookingDocument> {
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      throw new NotFoundError('Booking not found');
    }

    if (!(booking as any).canCheckOut()) {
      throw new ValidationError('Booking cannot be checked out. Must be checked in first.');
    }

    await (booking as any).checkOut({
      ...checkOutData,
      checkedOutBy
    });

    // Publish check-out event
    await this.messageBroker.publishEvent({
      id: uuidv4(),
      type: EVENT_TYPES.BOOKING_CHECKED_OUT,
      service: 'booking-service',
      data: {
        bookingId: booking._id,
        checkedOutAt: booking.checkOut!.checkedOutAt,
        damages: booking.checkOut!.damages
      },
      timestamp: new Date(),
      correlationId: uuidv4()
    });

    bookingLogger.logger.info('Booking checked out', { bookingId: booking._id });
    return booking;
  }

  public async addPayment(bookingId: string, paymentData: any): Promise<BookingDocument> {
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      throw new NotFoundError('Booking not found');
    }

    await (booking as any).addPayment(paymentData);

    // Publish payment event
    const eventType = paymentData.status === 'SUCCESS' ? EVENT_TYPES.PAYMENT_SUCCEEDED : EVENT_TYPES.PAYMENT_FAILED;
    await this.messageBroker.publishEvent({
      id: uuidv4(),
      type: eventType,
      service: 'booking-service',
      data: {
        bookingId: booking._id,
        amount: paymentData.amount,
        paymentStatus: booking.paymentStatus
      },
      timestamp: new Date(),
      correlationId: uuidv4()
    });

    bookingLogger.logger.info('Payment added to booking', { bookingId: booking._id, amount: paymentData.amount });
    return booking;
  }

  public async addSpecialRequest(bookingId: string, requestData: any, requestedBy: string): Promise<BookingDocument> {
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      throw new NotFoundError('Booking not found');
    }

    booking.specialRequests.push({
      ...requestData,
      requestedAt: new Date()
    });

    const updatedBooking = await booking.save();
    bookingLogger.logger.info('Special request added', { bookingId: booking._id, requestType: requestData.type });
    return updatedBooking;
  }

  public async updateSpecialRequest(bookingId: string, requestIndex: number, updateData: any, updatedBy: string): Promise<BookingDocument> {
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      throw new NotFoundError('Booking not found');
    }

    if (requestIndex < 0 || requestIndex >= booking.specialRequests.length) {
      throw new ValidationError('Invalid request index');
    }

    booking.specialRequests[requestIndex] = {
      ...booking.specialRequests[requestIndex],
      ...updateData,
      processedAt: new Date(),
      processedBy: updatedBy
    };

    const updatedBooking = await booking.save();
    bookingLogger.logger.info('Special request updated', { bookingId: booking._id, requestIndex });
    return updatedBooking;
  }

  public async addDocument(bookingId: string, documentData: any, uploadedBy: string): Promise<BookingDocument> {
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      throw new NotFoundError('Booking not found');
    }

    booking.documents.push({
      ...documentData,
      uploadedAt: new Date()
    });

    const updatedBooking = await booking.save();
    bookingLogger.logger.info('Document added', { bookingId: booking._id, documentType: documentData.type });
    return updatedBooking;
  }

  public async verifyDocument(bookingId: string, documentIndex: number, verifiedBy: string): Promise<BookingDocument> {
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      throw new NotFoundError('Booking not found');
    }

    if (documentIndex < 0 || documentIndex >= booking.documents.length) {
      throw new ValidationError('Invalid document index');
    }

    booking.documents[documentIndex].verified = true;
    booking.documents[documentIndex].verifiedBy = verifiedBy;
    booking.documents[documentIndex].verifiedAt = new Date();

    const updatedBooking = await booking.save();
    bookingLogger.logger.info('Document verified', { bookingId: booking._id, documentIndex });
    return updatedBooking;
  }

  public async acceptTerms(bookingId: string, acceptedBy: string): Promise<BookingDocument> {
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      throw new NotFoundError('Booking not found');
    }

    booking.terms.accepted = true;
    booking.terms.acceptedAt = new Date();
    booking.terms.acceptedBy = acceptedBy;

    const updatedBooking = await booking.save();
    bookingLogger.logger.info('Terms accepted', { bookingId: booking._id });
    return updatedBooking;
  }

  public async getBookingStatistics(): Promise<any> {
    const stats = await Booking.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' }
        }
      }
    ]);

    const totalBookings = await Booking.countDocuments();
    const activeBookings = await Booking.countDocuments({ status: { $in: ['CONFIRMED', 'CHECKED_IN'] } });
    const pendingPayments = await Booking.countDocuments({ paymentStatus: { $in: ['PENDING', 'PARTIAL'] } });

    return {
      byStatus: stats,
      totalBookings,
      activeBookings,
      pendingPayments
    };
  }

  public async getOverdueBookings(): Promise<BookingDocument[]> {
    return Booking.find({
      paymentStatus: { $in: ['PENDING', 'PARTIAL'] },
      dueDate: { $lt: new Date() }
    }).populate('studentId', 'fullName email');
  }

  public async getExpiredBookings(): Promise<BookingDocument[]> {
    return (Booking as any).findExpiredBookings();
  }

  private calculateDuration(startDate: Date | string, endDate?: Date | string): number {
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : start;
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(1, Math.ceil(diffDays / 30)); // Convert to months, minimum 1
  }
}

export const bookingService = new BookingService();
