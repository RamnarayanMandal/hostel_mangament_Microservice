import mongoose, { Schema, Document } from 'mongoose';
import { Payment as PaymentInterface } from '../../../types';

export interface PaymentDocument extends PaymentInterface, Document {}

const paymentSchema = new Schema<PaymentDocument>({
  paymentId: { 
    type: String, 
    required: true, 
    unique: true,
    default: () => `PAY${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`
  },
  bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', required: true },
  studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
  amount: { type: Number, required: true, min: 0 },
  currency: { type: String, enum: ['INR', 'USD'], default: 'INR' },
  paymentMethod: { 
    type: String, 
    enum: ['CASH', 'CARD', 'UPI', 'NET_BANKING', 'WALLET', 'CHEQUE', 'BANK_TRANSFER'],
    required: true 
  },
  paymentGateway: { 
    type: String, 
    enum: ['STRIPE', 'RAZORPAY', 'PAYTM', 'CASH', 'CHEQUE', 'BANK_TRANSFER'],
    required: true 
  },
  status: { 
    type: String, 
    enum: ['PENDING', 'PROCESSING', 'SUCCESS', 'FAILED', 'CANCELLED', 'REFUNDED', 'PARTIALLY_REFUNDED'],
    default: 'PENDING'
  },
  transactionId: { type: String, unique: true, sparse: true },
  gatewayTransactionId: { type: String },
  gatewayResponse: { type: Schema.Types.Mixed },
  gatewayError: { type: String },
  paymentIntentId: { type: String },
  refundId: { type: String },
  refundAmount: { type: Number, default: 0 },
  refundReason: { type: String },
  refundStatus: { 
    type: String, 
    enum: ['PENDING', 'PROCESSING', 'SUCCESS', 'FAILED'],
    default: 'PENDING'
  },
  paymentDate: { type: Date, default: Date.now },
  refundDate: { type: Date },
  dueDate: { type: Date },
  lateFees: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  taxAmount: { type: Number, default: 0 },
  processingFees: { type: Number, default: 0 },
  netAmount: { type: Number, required: true },
  description: { type: String },
  metadata: {
    source: { type: String, default: 'WEB' },
    userAgent: { type: String },
    ipAddress: { type: String },
    deviceInfo: { type: String },
    sessionId: { type: String }
  },
  receipt: {
    receiptNumber: { type: String },
    receiptUrl: { type: String },
    generatedAt: { type: Date }
  },
  webhookEvents: [{
    eventType: { type: String, required: true },
    eventData: { type: Schema.Types.Mixed },
    receivedAt: { type: Date, default: Date.now },
    processed: { type: Boolean, default: false },
    processedAt: { type: Date }
  }],
  retryAttempts: { type: Number, default: 0 },
  maxRetries: { type: Number, default: 3 },
  nextRetryAt: { type: Date },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, { 
  timestamps: true,
  toJSON: { 
    transform: (doc, ret) => {
      if (!ret._includeSensitiveData) {
        delete ret.gatewayResponse;
        delete ret.gatewayError;
        delete ret.metadata;
        delete ret.webhookEvents;
      }
      delete ret._includeSensitiveData;
      return ret;
    }
  }
});

// Indexes for performance
paymentSchema.index({ paymentId: 1 });
paymentSchema.index({ bookingId: 1 });
paymentSchema.index({ studentId: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ paymentDate: 1 });
paymentSchema.index({ transactionId: 1 });
paymentSchema.index({ paymentIntentId: 1 });
paymentSchema.index({ refundId: 1 });
paymentSchema.index({ createdAt: 1 });

// Static methods
paymentSchema.statics.findByBookingId = function(bookingId: string) {
  return this.find({ bookingId }).sort({ createdAt: -1 });
};

paymentSchema.statics.findByStudentId = function(studentId: string) {
  return this.find({ studentId }).sort({ createdAt: -1 });
};

paymentSchema.statics.findSuccessfulPayments = function(bookingId?: string) {
  const query: any = { status: 'SUCCESS' };
  if (bookingId) query.bookingId = bookingId;
  return this.find(query);
};

paymentSchema.statics.findPendingPayments = function() {
  return this.find({ 
    status: { $in: ['PENDING', 'PROCESSING'] },
    nextRetryAt: { $lte: new Date() }
  });
};

paymentSchema.statics.findFailedPayments = function() {
  return this.find({ 
    status: 'FAILED',
    retryAttempts: { $lt: 3 }
  });
};

paymentSchema.statics.findRefundablePayments = function() {
  return this.find({ 
    status: 'SUCCESS',
    refundAmount: { $lt: '$amount' }
  });
};

// Instance methods
paymentSchema.methods.isSuccessful = function() {
  return this.status === 'SUCCESS';
};

paymentSchema.methods.isFailed = function() {
  return this.status === 'FAILED';
};

paymentSchema.methods.isPending = function() {
  return ['PENDING', 'PROCESSING'].includes(this.status);
};

paymentSchema.methods.canRetry = function() {
  return this.status === 'FAILED' && this.retryAttempts < this.maxRetries;
};

paymentSchema.methods.canRefund = function() {
  return this.status === 'SUCCESS' && this.refundAmount < this.amount;
};

paymentSchema.methods.calculateRefundableAmount = function() {
  return Math.max(0, this.amount - this.refundAmount);
};

paymentSchema.methods.markAsProcessing = function() {
  this.status = 'PROCESSING';
  this.retryAttempts += 1;
  return this.save();
};

paymentSchema.methods.markAsSuccess = function(transactionData: any) {
  this.status = 'SUCCESS';
  this.transactionId = transactionData.transactionId;
  this.gatewayTransactionId = transactionData.gatewayTransactionId;
  this.gatewayResponse = transactionData.gatewayResponse;
  this.paymentDate = new Date();
  return this.save();
};

paymentSchema.methods.markAsFailed = function(errorData: any) {
  this.status = 'FAILED';
  this.gatewayError = errorData.error;
  this.gatewayResponse = errorData.response;
  this.nextRetryAt = new Date(Date.now() + Math.pow(2, this.retryAttempts) * 60 * 1000); // Exponential backoff
  return this.save();
};

paymentSchema.methods.processRefund = function(refundData: any) {
  this.refundAmount += refundData.amount;
  this.refundReason = refundData.reason;
  this.refundDate = new Date();
  
  if (this.refundAmount >= this.amount) {
    this.status = 'REFUNDED';
  } else {
    this.status = 'PARTIALLY_REFUNDED';
  }
  
  return this.save();
};

paymentSchema.methods.addWebhookEvent = function(eventData: any) {
  this.webhookEvents.push({
    eventType: eventData.type,
    eventData: eventData.data,
    receivedAt: new Date()
  });
  return this.save();
};

paymentSchema.methods.generateReceipt = function() {
  this.receipt = {
    receiptNumber: `RCP${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
    receiptUrl: `/receipts/${this.paymentId}.pdf`,
    generatedAt: new Date()
  };
  return this.save();
};

export const Payment = mongoose.model<PaymentDocument>('Payment', paymentSchema);
