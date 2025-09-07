import mongoose, { Schema, Document } from 'mongoose';
import { Booking as BookingInterface } from '../../../types';

export interface BookingDocument extends Omit<BookingInterface, '_id'>, Document {}

const bookingSchema = new Schema<BookingDocument>({
  bookingId: { 
    type: String, 
    required: true, 
    unique: true,
    default: () => `BK${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`
  },
  studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
  hostelId: { type: Schema.Types.ObjectId, ref: 'Hostel', required: true },
  roomId: { type: Schema.Types.ObjectId, ref: 'Room', required: true },
  bedId: { type: Schema.Types.ObjectId, ref: 'Bed', required: true },
  status: { 
    type: String, 
    enum: ['HOLD', 'PENDING_PAYMENT', 'CONFIRMED', 'CANCELLED', 'CHECKED_IN', 'CHECKED_OUT'],
    default: 'HOLD'
  },

  checkInDate: { type: Date, required: true },
  checkOutDate: { type: Date, required: true },
  duration: { type: Number, required: true, min: 1 }, // in months
  totalAmount: { type: Number, required: true, min: 0 },
  currency: { type: String, enum: ['INR', 'USD'], default: 'INR' },
  feePolicyId: { type: Schema.Types.ObjectId, ref: 'FeePolicy' },
  paymentStatus: { 
    type: String, 
    enum: ['PENDING', 'PARTIAL', 'COMPLETED', 'FAILED', 'REFUNDED'],
    default: 'PENDING'
  },
  amountDue: { type: Number, required: true },
  amountPaid: { type: Number, default: 0 },
  dueDate: { type: Date, required: true },
  paymentHistory: [{
    paymentId: { type: Schema.Types.ObjectId, ref: 'Payment' },
    amount: { type: Number, required: true },
    paymentDate: { type: Date, required: true },
    paymentMethod: { type: String, required: true },
    status: { type: String, required: true },
    transactionId: { type: String }
  }],
  specialRequests: [{
    type: { type: String, required: true },
    description: { type: String, required: true },
    status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'PENDING' },
    requestedAt: { type: Date, default: Date.now },
    processedAt: { type: Date },
    processedBy: { type: Schema.Types.ObjectId, ref: 'User' }
  }],
  documents: [{
    type: { type: String, required: true },
    fileName: { type: String, required: true },
    fileUrl: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now },
    verified: { type: Boolean, default: false },
    verifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    verifiedAt: { type: Date }
  }],
  terms: {
    accepted: { type: Boolean, default: false },
    acceptedAt: { type: Date },
    acceptedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    version: { type: String, required: true }
  },
  cancellation: {
    requestedAt: { type: Date },
    requestedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reason: { type: String },
    refundAmount: { type: Number },
    refundStatus: { type: String, enum: ['PENDING', 'PROCESSED', 'FAILED'] },
    processedAt: { type: Date },
    processedBy: { type: Schema.Types.ObjectId, ref: 'User' }
  },
  checkIn: {
    checkedInAt: { type: Date },
    checkedInBy: { type: Schema.Types.ObjectId, ref: 'User' },
    roomCondition: { type: String },
    notes: { type: String }
  },
  checkOut: {
    checkedOutAt: { type: Date },
    checkedOutBy: { type: Schema.Types.ObjectId, ref: 'User' },
    roomCondition: { type: String },
    damages: [{
      description: { type: String, required: true },
      estimatedCost: { type: Number },
      resolved: { type: Boolean, default: false }
    }],
    notes: { type: String }
  },
  notifications: [{
    type: { type: String, required: true },
    sentAt: { type: Date, default: Date.now },
    status: { type: String, enum: ['SENT', 'DELIVERED', 'FAILED'] },
    recipient: { type: String, required: true },
    content: { type: String, required: true }
  }],
  metadata: {
    source: { type: String, default: 'WEB' },
    userAgent: { type: String },
    ipAddress: { type: String },
    referrer: { type: String }
  },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, { 
  timestamps: true,
  toJSON: { 
    transform: (doc, ret) => {
      const retAny = ret as any;
      if (!retAny._includeSensitiveData) {
        delete retAny.paymentHistory;
        delete retAny.documents;
        delete retAny.metadata;
      }
      delete retAny._includeSensitiveData;
      return ret;
    }
  }
});

// Indexes for performance
bookingSchema.index({ studentId: 1, status: 1 });
bookingSchema.index({ hostelId: 1, status: 1 });
bookingSchema.index({ roomId: 1, bedId: 1 });
bookingSchema.index({ checkInDate: 1, checkOutDate: 1 });
bookingSchema.index({ bookingId: 1 });
bookingSchema.index({ allocationRequestId: 1 });
bookingSchema.index({ paymentStatus: 1 });
bookingSchema.index({ dueDate: 1 });
bookingSchema.index({ createdAt: 1 });

// Static methods
bookingSchema.statics.findActiveBookings = function(hostelId?: string, roomId?: string) {
  const query: any = { 
    status: { $in: ['CONFIRMED', 'CHECKED_IN'] },
    checkOutDate: { $gte: new Date() }
  };
  
  if (hostelId) query.hostelId = hostelId;
  if (roomId) query.roomId = roomId;
  
  return this.find(query);
};

bookingSchema.statics.findOverlappingBookings = function(bedId: string, checkInDate: Date, checkOutDate: Date, excludeBookingId?: string) {
  const query: any = {
    bedId,
    status: { $in: ['CONFIRMED', 'CHECKED_IN'] },
    $or: [
      {
        checkInDate: { $lt: checkOutDate },
        checkOutDate: { $gt: checkInDate }
      }
    ]
  };
  
  if (excludeBookingId) {
    query._id = { $ne: excludeBookingId };
  }
  
  return this.find(query);
};

bookingSchema.statics.findExpiredBookings = function() {
  return this.find({
    status: 'PENDING',
    createdAt: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } // 24 hours ago
  });
};

bookingSchema.statics.findDuePayments = function() {
  return this.find({
    paymentStatus: { $in: ['PENDING', 'PARTIAL'] },
    dueDate: { $lte: new Date() }
  });
};

// Instance methods
bookingSchema.methods.isActive = function() {
  return ['CONFIRMED', 'CHECKED_IN'].includes(this.status);
};

bookingSchema.methods.isOverlapping = function(checkInDate: Date, checkOutDate: Date) {
  return this.checkInDate < checkOutDate && this.checkOutDate > checkInDate;
};

bookingSchema.methods.calculateRemainingAmount = function() {
  return Math.max(0, this.totalAmount - this.amountPaid);
};

bookingSchema.methods.isPaymentOverdue = function() {
  return this.paymentStatus !== 'COMPLETED' && new Date() > this.dueDate;
};

bookingSchema.methods.canBeCancelled = function() {
  return ['PENDING', 'CONFIRMED'].includes(this.status) && !this.cancellation.requestedAt;
};

bookingSchema.methods.canCheckIn = function() {
  return this.status === 'CONFIRMED' && this.paymentStatus === 'COMPLETED';
};

bookingSchema.methods.canCheckOut = function() {
  return this.status === 'CHECKED_IN';
};

bookingSchema.methods.addPayment = function(paymentData: any) {
  this.paymentHistory.push(paymentData);
  this.amountPaid += paymentData.amount;
  this.amountDue = Math.max(0, this.totalAmount - this.amountPaid);
  
  if (this.amountDue === 0) {
    this.paymentStatus = 'COMPLETED';
  } else if (this.amountPaid > 0) {
    this.paymentStatus = 'PARTIAL';
  }
  
  return this.save();
};

bookingSchema.methods.requestCancellation = function(reason: string, requestedBy: string) {
  this.cancellation = {
    requestedAt: new Date(),
    requestedBy,
    reason,
    refundAmount: 0,
    refundStatus: 'PENDING'
  };
  
  this.status = 'CANCELLED';
  return this.save();
};

bookingSchema.methods.performCheckIn = function(checkInData: any) {
  this.checkIn = {
    checkedInAt: new Date(),
    checkedInBy: checkInData.checkedInBy,
    roomCondition: checkInData.roomCondition,
    notes: checkInData.notes
  };
  
  this.status = 'CHECKED_IN';
  return this.save();
};

bookingSchema.methods.performCheckOut = function(checkOutData: any) {
  this.checkOut = {
    checkedOutAt: new Date(),
    checkedOutBy: checkOutData.checkedOutBy,
    roomCondition: checkOutData.roomCondition,
    damages: checkOutData.damages || [],
    notes: checkOutData.notes
  };
  
  this.status = 'CHECKED_OUT';
  return this.save();
};

export const Booking = mongoose.model<BookingDocument>('Booking', bookingSchema);
