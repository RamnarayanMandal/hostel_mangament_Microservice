import mongoose, { Schema, Document } from 'mongoose';
import { AllocationRequest as AllocationRequestInterface } from '../../../types';

export interface AllocationRequestDocument extends AllocationRequestInterface, Document {}

const allocationRequestSchema = new Schema<AllocationRequestDocument>({
  studentId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Student', 
    required: true 
  },
  allocationRuleId: { 
    type: Schema.Types.ObjectId, 
    ref: 'AllocationRule', 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['PENDING', 'APPROVED', 'REJECTED', 'WAITLISTED', 'ALLOCATED', 'CANCELLED'],
    default: 'PENDING'
  },
  priority: { 
    type: Number, 
    default: 0 
  },
  preferences: {
    hostelIds: [{ type: Schema.Types.ObjectId, ref: 'Hostel' }],
    roomTypes: [{ type: String, enum: ['SINGLE', 'DOUBLE', 'TRIPLE', 'DORM'] }],
    roommatePreferences: [{ type: String, trim: true }],
    specialRequirements: [{ type: String, trim: true }]
  },
  allocation: {
    hostelId: { type: Schema.Types.ObjectId, ref: 'Hostel' },
    roomId: { type: Schema.Types.ObjectId, ref: 'Room' },
    bedId: { type: Schema.Types.ObjectId, ref: 'Bed' },
    allocatedAt: { type: Date },
    allocatedBy: { type: Schema.Types.ObjectId, ref: 'User' }
  },
  waitlist: {
    position: { type: Number },
    addedAt: { type: Date },
    estimatedWaitTime: { type: Number } // in days
  },
  documents: [{
    type: { type: String, required: true, trim: true },
    url: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now },
    verified: { type: Boolean, default: false },
    verifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    verifiedAt: { type: Date }
  }],
  review: {
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
    comments: { type: String, trim: true },
    rejectionReason: { type: String, trim: true }
  },
  timeline: [{
    action: { type: String, required: true },
    status: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    performedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    comments: { type: String, trim: true }
  }],
  metadata: {
    applicationSource: { type: String, default: 'WEB' }, // WEB, MOBILE, ADMIN
    ipAddress: { type: String },
    userAgent: { type: String },
    sessionId: { type: String }
  }
}, { 
  timestamps: true,
  toJSON: { 
    transform: (doc, ret) => {
      if (!ret._includeSensitiveData) {
        delete ret.metadata;
      }
      delete ret._includeSensitiveData;
      return ret;
    }
  }
});

// Indexes
allocationRequestSchema.index({ studentId: 1, allocationRuleId: 1 }, { unique: true });
allocationRequestSchema.index({ status: 1 });
allocationRequestSchema.index({ priority: -1, createdAt: 1 });
allocationRequestSchema.index({ 'allocation.hostelId': 1 });
allocationRequestSchema.index({ 'allocation.roomId': 1 });
allocationRequestSchema.index({ 'allocation.bedId': 1 });
allocationRequestSchema.index({ 'waitlist.position': 1 });
allocationRequestSchema.index({ createdAt: 1 });
allocationRequestSchema.index({ updatedAt: 1 });

// Compound indexes for efficient querying
allocationRequestSchema.index({ 
  status: 1, 
  priority: -1, 
  createdAt: 1 
});

allocationRequestSchema.index({ 
  allocationRuleId: 1, 
  status: 1, 
  priority: -1 
});

allocationRequestSchema.index({ 
  'allocation.hostelId': 1, 
  status: 1 
});

// Static methods
allocationRequestSchema.statics.findByStudentAndRule = function(studentId: string, allocationRuleId: string) {
  return this.findOne({ studentId, allocationRuleId });
};

allocationRequestSchema.statics.findPendingRequests = function() {
  return this.find({ status: 'PENDING' }).sort({ priority: -1, createdAt: 1 });
};

allocationRequestSchema.statics.findWaitlistedRequests = function() {
  return this.find({ status: 'WAITLISTED' }).sort({ 'waitlist.position': 1 });
};

allocationRequestSchema.statics.findApprovedRequests = function() {
  return this.find({ status: 'APPROVED' }).sort({ priority: -1, createdAt: 1 });
};

allocationRequestSchema.statics.findRequestsByHostel = function(hostelId: string) {
  return this.find({ 'allocation.hostelId': hostelId });
};

allocationRequestSchema.statics.findRequestsByStatus = function(status: string) {
  return this.find({ status }).sort({ createdAt: 1 });
};

allocationRequestSchema.statics.getWaitlistPosition = function(allocationRuleId: string) {
  return this.countDocuments({ 
    allocationRuleId, 
    status: 'WAITLISTED' 
  });
};

// Instance methods
allocationRequestSchema.methods.addTimelineEvent = function(action: string, status: string, performedBy: string, comments?: string) {
  this.timeline.push({
    action,
    status,
    timestamp: new Date(),
    performedBy,
    comments
  });
};

allocationRequestSchema.methods.approve = function(reviewedBy: string, comments?: string) {
  this.status = 'APPROVED';
  this.review = {
    reviewedBy,
    reviewedAt: new Date(),
    comments
  };
  this.addTimelineEvent('APPROVED', 'APPROVED', reviewedBy, comments);
};

allocationRequestSchema.methods.reject = function(reviewedBy: string, reason: string, comments?: string) {
  this.status = 'REJECTED';
  this.review = {
    reviewedBy,
    reviewedAt: new Date(),
    comments,
    rejectionReason: reason
  };
  this.addTimelineEvent('REJECTED', 'REJECTED', reviewedBy, comments);
};

allocationRequestSchema.methods.addToWaitlist = function(position: number, estimatedWaitTime?: number) {
  this.status = 'WAITLISTED';
  this.waitlist = {
    position,
    addedAt: new Date(),
    estimatedWaitTime
  };
  this.addTimelineEvent('WAITLISTED', 'WAITLISTED', 'SYSTEM', `Position: ${position}`);
};

allocationRequestSchema.methods.allocate = function(hostelId: string, roomId: string, bedId: string, allocatedBy: string) {
  this.status = 'ALLOCATED';
  this.allocation = {
    hostelId,
    roomId,
    bedId,
    allocatedAt: new Date(),
    allocatedBy
  };
  this.addTimelineEvent('ALLOCATED', 'ALLOCATED', allocatedBy, `Allocated to hostel: ${hostelId}, room: ${roomId}, bed: ${bedId}`);
};

allocationRequestSchema.methods.cancel = function(cancelledBy: string, reason?: string) {
  this.status = 'CANCELLED';
  this.addTimelineEvent('CANCELLED', 'CANCELLED', cancelledBy, reason);
};

allocationRequestSchema.methods.updateWaitlistPosition = function(newPosition: number) {
  if (this.status === 'WAITLISTED') {
    this.waitlist.position = newPosition;
    this.addTimelineEvent('POSITION_UPDATED', 'WAITLISTED', 'SYSTEM', `New position: ${newPosition}`);
  }
};

allocationRequestSchema.methods.addDocument = function(type: string, url: string) {
  this.documents.push({
    type,
    url,
    uploadedAt: new Date()
  });
  this.addTimelineEvent('DOCUMENT_ADDED', this.status, 'SYSTEM', `Document type: ${type}`);
};

allocationRequestSchema.methods.verifyDocument = function(documentIndex: number, verifiedBy: string) {
  if (this.documents[documentIndex]) {
    this.documents[documentIndex].verified = true;
    this.documents[documentIndex].verifiedBy = verifiedBy;
    this.documents[documentIndex].verifiedAt = new Date();
    this.addTimelineEvent('DOCUMENT_VERIFIED', this.status, verifiedBy, `Document index: ${documentIndex}`);
  }
};

allocationRequestSchema.methods.isEligibleForAllocation = function() {
  return this.status === 'APPROVED' && 
         this.documents.every(doc => doc.verified) &&
         !this.allocation.bedId;
};

allocationRequestSchema.methods.canBeWaitlisted = function() {
  return this.status === 'PENDING' || this.status === 'APPROVED';
};

export const AllocationRequest = mongoose.model<AllocationRequestDocument>('AllocationRequest', allocationRequestSchema);
