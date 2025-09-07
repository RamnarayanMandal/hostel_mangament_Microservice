import mongoose, { Schema, Document } from 'mongoose';
import { Notification as NotificationInterface } from '../../../types';

export interface NotificationDocument extends Omit<NotificationInterface, '_id'>, Document {
  isPending(): boolean;
  isSent(): boolean;
  isDelivered(): boolean;
  isFailed(): boolean;
  canRetry(): boolean;
  markAsSent(providerData: any): Promise<NotificationDocument>;
  markAsDelivered(): Promise<NotificationDocument>;
  markAsFailed(errorData: any): Promise<NotificationDocument>;
}

const notificationSchema = new Schema<NotificationDocument>({
  notificationId: { 
    type: String, 
    required: true, 
    unique: true,
    default: () => `NOTIF${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`
  },
  type: { 
    type: String, 
    enum: ['EMAIL', 'SMS', 'PUSH', 'IN_APP', 'WHATSAPP'],
    required: true 
  },
  category: { 
    type: String, 
    enum: ['BOOKING', 'PAYMENT', 'ALLOCATION', 'SYSTEM', 'REMINDER', 'ALERT'],
    required: true 
  },
  priority: { 
    type: String, 
    enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
    default: 'MEDIUM'
  },
  status: { 
    type: String, 
    enum: ['PENDING', 'SENT', 'DELIVERED', 'FAILED', 'CANCELLED'],
    default: 'PENDING'
  },
  recipient: {
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student' },
    email: { type: String },
    phone: { type: String },
    deviceToken: { type: String }
  },
  content: {
    subject: { type: String },
    title: { type: String },
    message: { type: String, required: true },
    template: { type: String },
    templateData: { type: Schema.Types.Mixed },
    attachments: [{
      fileName: { type: String },
      fileUrl: { type: String },
      mimeType: { type: String }
    }]
  },
  metadata: {
    source: { type: String, default: 'SYSTEM' },
    eventType: { type: String },
    eventId: { type: String },
    correlationId: { type: String },
    userAgent: { type: String },
    ipAddress: { type: String }
  },
  delivery: {
    scheduledAt: { type: Date },
    sentAt: { type: Date },
    deliveredAt: { type: Date },
    failedAt: { type: Date },
    retryCount: { type: Number, default: 0 },
    maxRetries: { type: Number, default: 3 },
    nextRetryAt: { type: Date },
    provider: { type: String },
    providerResponse: { type: Schema.Types.Mixed },
    providerError: { type: String }
  },
  tracking: {
    openedAt: { type: Date },
    clickedAt: { type: Date },
    clickedLinks: [{ type: String }],
    userAgent: { type: String },
    ipAddress: { type: String }
  },
  preferences: {
    emailEnabled: { type: Boolean, default: true },
    smsEnabled: { type: Boolean, default: true },
    pushEnabled: { type: Boolean, default: true },
    inAppEnabled: { type: Boolean, default: true },
    whatsappEnabled: { type: Boolean, default: false }
  },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, { 
  timestamps: true,
  toJSON: { 
    transform: (doc, ret) => {
      // Remove sensitive data by default
      if (ret.delivery) {
        delete ret.delivery.providerResponse;
        delete ret.delivery.providerError;
      }
      delete (ret as any).metadata;
      return ret;
    }
  }
});

// Indexes for performance
notificationSchema.index({ notificationId: 1 });
notificationSchema.index({ recipient: 1 });
notificationSchema.index({ status: 1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ category: 1 });
notificationSchema.index({ 'delivery.scheduledAt': 1 });
notificationSchema.index({ 'delivery.sentAt': 1 });
notificationSchema.index({ createdAt: 1 });

// Static methods
notificationSchema.statics.findByRecipient = function(recipientId: string, type?: string) {
  const query: any = { 
    $or: [
      { 'recipient.userId': recipientId },
      { 'recipient.studentId': recipientId }
    ]
  };
  
  if (type) query.type = type;
  
  return this.find(query).sort({ createdAt: -1 });
};

notificationSchema.statics.findPendingNotifications = function() {
  return this.find({ 
    status: 'PENDING',
    $or: [
      { 'delivery.scheduledAt': { $lte: new Date() } },
      { 'delivery.scheduledAt': { $exists: false } }
    ]
  });
};

notificationSchema.statics.findFailedNotifications = function() {
  return this.find({ 
    status: 'FAILED',
    'delivery.retryCount': { $lt: '$delivery.maxRetries' }
  });
};

// Instance methods
notificationSchema.methods.isPending = function() {
  return this.status === 'PENDING';
};

notificationSchema.methods.isSent = function() {
  return this.status === 'SENT';
};

notificationSchema.methods.isDelivered = function() {
  return this.status === 'DELIVERED';
};

notificationSchema.methods.isFailed = function() {
  return this.status === 'FAILED';
};

notificationSchema.methods.canRetry = function() {
  return this.status === 'FAILED' && this.delivery.retryCount < this.delivery.maxRetries;
};

notificationSchema.methods.markAsSent = function(providerData: any) {
  this.status = 'SENT';
  this.delivery.sentAt = new Date();
  this.delivery.provider = providerData.provider;
  this.delivery.providerResponse = providerData.response;
  return this.save();
};

notificationSchema.methods.markAsDelivered = function() {
  this.status = 'DELIVERED';
  this.delivery.deliveredAt = new Date();
  return this.save();
};

notificationSchema.methods.markAsFailed = function(errorData: any) {
  this.status = 'FAILED';
  this.delivery.failedAt = new Date();
  this.delivery.providerError = errorData.error;
  this.delivery.providerResponse = errorData.response;
  this.delivery.retryCount += 1;
  
  if (this.delivery.retryCount < this.delivery.maxRetries) {
    const backoffMinutes = Math.pow(2, this.delivery.retryCount);
    this.delivery.nextRetryAt = new Date(Date.now() + backoffMinutes * 60 * 1000);
  }
  
  return this.save();
};

export const Notification = mongoose.model<NotificationDocument>('Notification', notificationSchema);
