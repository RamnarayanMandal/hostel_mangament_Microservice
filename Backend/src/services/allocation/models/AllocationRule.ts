import mongoose, { Schema, Document } from 'mongoose';
import { AllocationRule as AllocationRuleInterface } from '../../../types';

export interface AllocationRuleDocument extends AllocationRuleInterface, Document {}

const allocationRuleSchema = new Schema<AllocationRuleDocument>({
  name: { 
    type: String, 
    required: true, 
    trim: true, 
    minlength: [2, 'Rule name must be at least 2 characters'],
    maxlength: [100, 'Rule name cannot exceed 100 characters']
  },
  description: { 
    type: String, 
    trim: true, 
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  priority: { 
    type: Number, 
    required: true, 
    min: [1, 'Priority must be at least 1'],
    max: [100, 'Priority cannot exceed 100']
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  criteria: {
    yearRange: {
      min: { type: Number, min: [1, 'Minimum year must be at least 1'] },
      max: { type: Number, min: [1, 'Maximum year must be at least 1'] }
    },
    categories: [{ type: String, enum: ['GEN', 'OBC', 'SC', 'ST', 'EWS'] }],
    domicileStates: [{ type: String, trim: true }],
    programs: [{ type: String, trim: true }],
    seniorityScoreRange: {
      min: { type: Number, min: [0, 'Minimum seniority score cannot be negative'] },
      max: { type: Number, min: [0, 'Maximum seniority score cannot be negative'] }
    },
    kycStatus: [{ type: String, enum: ['PENDING', 'VERIFIED', 'REJECTED'] }]
  },
  allocation: {
    hostelIds: [{ type: Schema.Types.ObjectId, ref: 'Hostel' }],
    roomTypes: [{ type: String, enum: ['SINGLE', 'DOUBLE', 'TRIPLE', 'DORM'] }],
    genderPolicy: { type: String, enum: ['MALE', 'FEMALE', 'ANY'] },
    maxStudentsPerRoom: { type: Number, min: [1, 'Max students per room must be at least 1'] },
    allocationMethod: { 
      type: String, 
      enum: ['FIRST_COME_FIRST_SERVE', 'LOTTERY', 'MERIT_BASED', 'SENIORITY_BASED'],
      default: 'SENIORITY_BASED'
    }
  },
  constraints: {
    maxDuration: { type: Number, min: [1, 'Max duration must be at least 1 day'] }, // in days
    allowTransfers: { type: Boolean, default: true },
    allowExtensions: { type: Boolean, default: true },
    requireParentalConsent: { type: Boolean, default: false },
    requireMedicalCertificate: { type: Boolean, default: false }
  },
  quotas: {
    totalSeats: { type: Number, min: [0, 'Total seats cannot be negative'] },
    reservedSeats: { type: Number, min: [0, 'Reserved seats cannot be negative'] },
    waitlistCapacity: { type: Number, min: [0, 'Waitlist capacity cannot be negative'], default: 0 }
  },
  schedule: {
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    applicationDeadline: { type: Date, required: true },
    allocationStartDate: { type: Date, required: true },
    allocationEndDate: { type: Date, required: true }
  },
  createdBy: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  updatedBy: { 
    type: Schema.Types.ObjectId, 
    ref: 'User' 
  }
}, { 
  timestamps: true,
  toJSON: { 
    transform: (doc, ret) => {
      if (!ret._includeSensitiveData) {
        delete ret.criteria.categories;
      }
      delete ret._includeSensitiveData;
      return ret;
    }
  }
});

// Indexes
allocationRuleSchema.index({ priority: -1, isActive: 1 });
allocationRuleSchema.index({ 'schedule.startDate': 1, 'schedule.endDate': 1 });
allocationRuleSchema.index({ 'criteria.yearRange.min': 1, 'criteria.yearRange.max': 1 });
allocationRuleSchema.index({ 'allocation.hostelIds': 1 });
allocationRuleSchema.index({ 'allocation.roomTypes': 1 });
allocationRuleSchema.index({ 'allocation.genderPolicy': 1 });
allocationRuleSchema.index({ createdBy: 1 });
allocationRuleSchema.index({ isActive: 1, 'schedule.startDate': 1, 'schedule.endDate': 1 });

// Compound indexes for efficient querying
allocationRuleSchema.index({ 
  isActive: 1, 
  'schedule.startDate': 1, 
  'schedule.endDate': 1, 
  priority: -1 
});

allocationRuleSchema.index({ 
  isActive: 1, 
  'criteria.yearRange.min': 1, 
  'criteria.yearRange.max': 1, 
  'allocation.genderPolicy': 1 
});

// Static methods
allocationRuleSchema.statics.findActiveRules = function() {
  return this.find({ 
    isActive: true,
    'schedule.startDate': { $lte: new Date() },
    'schedule.endDate': { $gte: new Date() }
  }).sort({ priority: -1 });
};

allocationRuleSchema.statics.findRulesForStudent = function(studentData: any) {
  const { year, category, domicileState, program, seniorityScore, kycStatus } = studentData;
  
  return this.find({
    isActive: true,
    'schedule.startDate': { $lte: new Date() },
    'schedule.endDate': { $gte: new Date() },
    $or: [
      { 'criteria.yearRange.min': { $lte: year }, 'criteria.yearRange.max': { $gte: year } },
      { 'criteria.yearRange.min': { $exists: false }, 'criteria.yearRange.max': { $exists: false } }
    ],
    $or: [
      { 'criteria.categories': category },
      { 'criteria.categories': { $exists: false } }
    ],
    $or: [
      { 'criteria.domicileStates': domicileState },
      { 'criteria.domicileStates': { $exists: false } }
    ],
    $or: [
      { 'criteria.programs': program },
      { 'criteria.programs': { $exists: false } }
    ],
    $or: [
      { 
        'criteria.seniorityScoreRange.min': { $lte: seniorityScore }, 
        'criteria.seniorityScoreRange.max': { $gte: seniorityScore } 
      },
      { 'criteria.seniorityScoreRange.min': { $exists: false }, 'criteria.seniorityScoreRange.max': { $exists: false } }
    ],
    $or: [
      { 'criteria.kycStatus': kycStatus },
      { 'criteria.kycStatus': { $exists: false } }
    ]
  }).sort({ priority: -1 });
};

allocationRuleSchema.statics.findRulesForHostel = function(hostelId: string) {
  return this.find({
    isActive: true,
    'schedule.startDate': { $lte: new Date() },
    'schedule.endDate': { $gte: new Date() },
    'allocation.hostelIds': hostelId
  }).sort({ priority: -1 });
};

// Instance methods
allocationRuleSchema.methods.isCurrentlyActive = function() {
  const now = new Date();
  return this.isActive && 
         this.schedule.startDate <= now && 
         this.schedule.endDate >= now;
};

allocationRuleSchema.methods.canApply = function() {
  const now = new Date();
  return this.isActive && 
         this.schedule.startDate <= now && 
         this.schedule.applicationDeadline >= now;
};

allocationRuleSchema.methods.isAllocationPeriod = function() {
  const now = new Date();
  return this.isActive && 
         this.schedule.allocationStartDate <= now && 
         this.schedule.allocationEndDate >= now;
};

allocationRuleSchema.methods.matchesStudentCriteria = function(studentData: any) {
  const { year, category, domicileState, program, seniorityScore, kycStatus } = studentData;
  
  // Check year range
  if (this.criteria.yearRange) {
    if (year < this.criteria.yearRange.min || year > this.criteria.yearRange.max) {
      return false;
    }
  }
  
  // Check category
  if (this.criteria.categories && this.criteria.categories.length > 0) {
    if (!this.criteria.categories.includes(category)) {
      return false;
    }
  }
  
  // Check domicile state
  if (this.criteria.domicileStates && this.criteria.domicileStates.length > 0) {
    if (!this.criteria.domicileStates.includes(domicileState)) {
      return false;
    }
  }
  
  // Check program
  if (this.criteria.programs && this.criteria.programs.length > 0) {
    if (!this.criteria.programs.includes(program)) {
      return false;
    }
  }
  
  // Check seniority score range
  if (this.criteria.seniorityScoreRange) {
    if (seniorityScore < this.criteria.seniorityScoreRange.min || 
        seniorityScore > this.criteria.seniorityScoreRange.max) {
      return false;
    }
  }
  
  // Check KYC status
  if (this.criteria.kycStatus && this.criteria.kycStatus.length > 0) {
    if (!this.criteria.kycStatus.includes(kycStatus)) {
      return false;
    }
  }
  
  return true;
};

allocationRuleSchema.methods.getAvailableSeats = function() {
  return Math.max(0, this.quotas.totalSeats - this.quotas.reservedSeats);
};

allocationRuleSchema.methods.reserveSeat = function() {
  if (this.quotas.reservedSeats < this.quotas.totalSeats) {
    this.quotas.reservedSeats += 1;
    return true;
  }
  return false;
};

allocationRuleSchema.methods.releaseSeat = function() {
  if (this.quotas.reservedSeats > 0) {
    this.quotas.reservedSeats -= 1;
    return true;
  }
  return false;
};

export const AllocationRule = mongoose.model<AllocationRuleDocument>('AllocationRule', allocationRuleSchema);
