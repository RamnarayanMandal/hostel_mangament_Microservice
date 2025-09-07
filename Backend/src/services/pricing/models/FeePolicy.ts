import mongoose, { Schema, Document } from 'mongoose';
import { FeePolicy as FeePolicyInterface } from '../../../types';

export interface FeePolicyDocument extends FeePolicyInterface, Document {}

const feePolicySchema = new Schema<FeePolicyDocument>({
  name: { 
    type: String, 
    required: true, 
    trim: true, 
    minlength: [2, 'Policy name must be at least 2 characters'],
    maxlength: [100, 'Policy name cannot exceed 100 characters']
  },
  description: { 
    type: String, 
    trim: true, 
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  hostelId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Hostel', 
    required: true 
  },
  roomType: { 
    type: String, 
    enum: ['SINGLE', 'DOUBLE', 'TRIPLE', 'DORM'],
    required: true 
  },
  baseMonthlyFee: { 
    type: Number, 
    required: true, 
    min: [0, 'Base fee cannot be negative']
  },
  currency: { 
    type: String, 
    enum: ['INR', 'USD'], 
    default: 'INR' 
  },
  effectiveFrom: { 
    type: Date, 
    required: true 
  },
  effectiveTo: { 
    type: Date 
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  adjustments: [{
    type: { 
      type: String, 
      enum: ['CATEGORY_CONCESSION', 'SCHOLARSHIP', 'SURCHARGE', 'EARLY_BIRD', 'LATE_FEE'],
      required: true 
    },
    name: { 
      type: String, 
      required: true, 
      trim: true 
    },
    description: { 
      type: String, 
      trim: true 
    },
    match: {
      category: { type: String, enum: ['GEN', 'OBC', 'SC', 'ST', 'EWS'] },
      year: { type: Number, min: [1, 'Year must be at least 1'] },
      domicileState: { type: String, trim: true },
      program: { type: String, trim: true },
      kycStatus: { type: String, enum: ['PENDING', 'VERIFIED', 'REJECTED'] },
      seniorityScore: { 
        min: { type: Number, min: [0, 'Minimum seniority score cannot be negative'] },
        max: { type: Number, min: [0, 'Maximum seniority score cannot be negative'] }
      }
    },
    value: {
      kind: { 
        type: String, 
        enum: ['PERCENT', 'FLAT'], 
        required: true 
      },
      amount: { 
        type: Number, 
        required: true 
      },
      maxAmount: { 
        type: Number, 
        min: [0, 'Maximum amount cannot be negative'] 
      }
    },
    priority: { 
      type: Number, 
      default: 0 
    },
    isActive: { 
      type: Boolean, 
      default: true 
    },
    validFrom: { 
      type: Date, 
      default: Date.now 
    },
    validTo: { 
      type: Date 
    }
  }],
  paymentTerms: {
    dueDate: { 
      type: Number, 
      min: [1, 'Due date must be at least 1'], 
      max: [31, 'Due date cannot exceed 31'],
      default: 5 
    }, // Day of month
    gracePeriod: { 
      type: Number, 
      min: [0, 'Grace period cannot be negative'], 
      default: 5 
    }, // Days
    lateFeePercentage: { 
      type: Number, 
      min: [0, 'Late fee percentage cannot be negative'], 
      default: 2 
    },
    installmentAllowed: { 
      type: Boolean, 
      default: false 
    },
    maxInstallments: { 
      type: Number, 
      min: [1, 'Max installments must be at least 1'], 
      default: 1 
    }
  },
  refundPolicy: {
    cancellationAllowed: { 
      type: Boolean, 
      default: true 
    },
    refundPercentage: { 
      type: Number, 
      min: [0, 'Refund percentage cannot be negative'], 
      max: [100, 'Refund percentage cannot exceed 100'], 
      default: 80 
    },
    processingDays: { 
      type: Number, 
      min: [1, 'Processing days must be at least 1'], 
      default: 7 
    }
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
        delete ret.adjustments;
      }
      delete ret._includeSensitiveData;
      return ret;
    }
  }
});

// Indexes
feePolicySchema.index({ hostelId: 1, roomType: 1 });
feePolicySchema.index({ effectiveFrom: 1, effectiveTo: 1 });
feePolicySchema.index({ isActive: 1 });
feePolicySchema.index({ 'adjustments.type': 1 });
feePolicySchema.index({ 'adjustments.match.category': 1 });
feePolicySchema.index({ createdBy: 1 });

// Compound indexes for efficient querying
feePolicySchema.index({ 
  hostelId: 1, 
  roomType: 1, 
  isActive: 1, 
  effectiveFrom: 1, 
  effectiveTo: 1 
});

feePolicySchema.index({ 
  isActive: 1, 
  'adjustments.isActive': 1, 
  'adjustments.validFrom': 1, 
  'adjustments.validTo': 1 
});

// Static methods
feePolicySchema.statics.findActivePolicies = function() {
  const now = new Date();
  return this.find({
    isActive: true,
    effectiveFrom: { $lte: now },
    $or: [
      { effectiveTo: { $gte: now } },
      { effectiveTo: { $exists: false } }
    ]
  });
};

feePolicySchema.statics.findPoliciesForHostel = function(hostelId: string) {
  const now = new Date();
  return this.find({
    hostelId,
    isActive: true,
    effectiveFrom: { $lte: now },
    $or: [
      { effectiveTo: { $gte: now } },
      { effectiveTo: { $exists: false } }
    ]
  });
};

feePolicySchema.statics.findPoliciesForRoomType = function(hostelId: string, roomType: string) {
  const now = new Date();
  return this.find({
    hostelId,
    roomType,
    isActive: true,
    effectiveFrom: { $lte: now },
    $or: [
      { effectiveTo: { $gte: now } },
      { effectiveTo: { $exists: false } }
    ]
  }).sort({ effectiveFrom: -1 });
};

// Instance methods
feePolicySchema.methods.isCurrentlyActive = function() {
  const now = new Date();
  return this.isActive && 
         this.effectiveFrom <= now && 
         (!this.effectiveTo || this.effectiveTo >= now);
};

feePolicySchema.methods.calculateFee = function(studentData: any, duration: number = 1): {
  baseAmount: number;
  adjustments: Array<{ type: string; name: string; amount: number; description: string }>;
  totalAmount: number;
  breakdown: any;
} {
  const baseAmount = this.baseMonthlyFee * duration;
  const adjustments: Array<{ type: string; name: string; amount: number; description: string }> = [];
  let totalAmount = baseAmount;

  // Apply adjustments
  const activeAdjustments = this.adjustments.filter(adj => 
    adj.isActive && 
    adj.validFrom <= new Date() && 
    (!adj.validTo || adj.validTo >= new Date())
  );

  // Sort by priority (higher priority first)
  activeAdjustments.sort((a, b) => b.priority - a.priority);

  for (const adjustment of activeAdjustments) {
    if (this.matchesAdjustmentCriteria(adjustment, studentData)) {
      let adjustmentAmount = 0;

      if (adjustment.value.kind === 'PERCENT') {
        adjustmentAmount = (baseAmount * adjustment.value.amount) / 100;
      } else {
        adjustmentAmount = adjustment.value.amount;
      }

      // Apply max amount limit if specified
      if (adjustment.value.maxAmount && adjustmentAmount > adjustment.value.maxAmount) {
        adjustmentAmount = adjustment.value.maxAmount;
      }

      // For surcharges, add to total; for concessions/scholarships, subtract
      if (adjustment.type === 'SURCHARGE' || adjustment.type === 'LATE_FEE') {
        totalAmount += adjustmentAmount;
      } else {
        totalAmount -= adjustmentAmount;
      }

      adjustments.push({
        type: adjustment.type,
        name: adjustment.name,
        amount: adjustmentAmount,
        description: adjustment.description || ''
      });
    }
  }

  return {
    baseAmount,
    adjustments,
    totalAmount: Math.max(0, totalAmount), // Ensure non-negative
    breakdown: {
      baseMonthlyFee: this.baseMonthlyFee,
      duration,
      currency: this.currency,
      adjustmentsApplied: adjustments.length
    }
  };
};

feePolicySchema.methods.matchesAdjustmentCriteria = function(adjustment: any, studentData: any): boolean {
  const { category, year, domicileState, program, kycStatus, seniorityScore } = studentData;

  // Check category
  if (adjustment.match.category && adjustment.match.category !== category) {
    return false;
  }

  // Check year
  if (adjustment.match.year && adjustment.match.year !== year) {
    return false;
  }

  // Check domicile state
  if (adjustment.match.domicileState && adjustment.match.domicileState !== domicileState) {
    return false;
  }

  // Check program
  if (adjustment.match.program && adjustment.match.program !== program) {
    return false;
  }

  // Check KYC status
  if (adjustment.match.kycStatus && adjustment.match.kycStatus !== kycStatus) {
    return false;
  }

  // Check seniority score range
  if (adjustment.match.seniorityScore) {
    const { min, max } = adjustment.match.seniorityScore;
    if (seniorityScore < min || seniorityScore > max) {
      return false;
    }
  }

  return true;
};

feePolicySchema.methods.calculateLateFee = function(amount: number, daysLate: number): number {
  if (daysLate <= this.paymentTerms.gracePeriod) {
    return 0;
  }

  const lateFeeDays = daysLate - this.paymentTerms.gracePeriod;
  return (amount * this.paymentTerms.lateFeePercentage * lateFeeDays) / 100;
};

feePolicySchema.methods.calculateRefund = function(amount: number): number {
  return (amount * this.refundPolicy.refundPercentage) / 100;
};

export const FeePolicy = mongoose.model<FeePolicyDocument>('FeePolicy', feePolicySchema);
