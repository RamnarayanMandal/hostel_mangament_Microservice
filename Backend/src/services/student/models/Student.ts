import mongoose, { Schema, Document, Model } from 'mongoose';
import { StudentProfile as StudentInterface } from '../../../types';

export interface StudentStaticMethods {
  findByUserId(userId: string): Promise<StudentDocument | null>;
  findByEnrollmentNo(enrollmentNo: string): Promise<StudentDocument | null>;
  findByYear(year: number): Promise<StudentDocument[]>;
  findByCategory(category: string): Promise<StudentDocument[]>;
  findByKycStatus(kycStatus: string): Promise<StudentDocument[]>;
  findEligibleForAllocation(criteria: any): Promise<StudentDocument[]>;
}

export interface StudentDocument extends Omit<StudentInterface, '_id'>, Document {
  _includeSensitiveData?: boolean;
  documents: Array<{
    type: string;
    url: string;
    verified: boolean;
    verifiedAt?: Date;
    verifiedBy?: any;
  }>;
  calculateSeniorityScore(): number;
  updateSeniorityScore(): Promise<StudentDocument>;
  verifyKyc(verifiedBy: string): Promise<StudentDocument>;
  rejectKyc(reason?: string): Promise<StudentDocument>;
  addDocument(documentData: any): Promise<StudentDocument>;
  verifyDocument(documentIndex: number, verifiedBy: string): Promise<StudentDocument>;
  withSensitiveData(): StudentDocument;
}

export interface StudentModel extends Model<StudentDocument>, StudentStaticMethods {}

const documentSchema = new Schema({
  type: {
    type: String,
    required: true,
    enum: ['AADHAR', 'PAN', 'DRIVING_LICENSE', 'PASSPORT', 'CERTIFICATE', 'OTHER'],
  },
  url: {
    type: String,
    required: true,
  },
  verified: {
    type: Boolean,
    default: false,
  },
  verifiedAt: {
    type: Date,
  },
  verifiedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
});

const studentSchema = new Schema<StudentDocument>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  enrollmentNo: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true,
  },
  program: {
    type: String,
    trim: true,
  },
  year: {
    type: Number,
    required: true,
    min: [1, 'Year must be at least 1'],
    max: [10, 'Year cannot exceed 10'],
  },
  semester: {
    type: Number,
    min: [1, 'Semester must be at least 1'],
    max: [12, 'Semester cannot exceed 12'],
  },
  category: {
    type: String,
    enum: ['GEN', 'OBC', 'SC', 'ST', 'EWS'],
    // Note: This field is sensitive and should be access-controlled
  },
  domicileState: {
    type: String,
    trim: true,
  },
  seniorityScore: {
    type: Number,
    required: true,
    default: 0,
    min: [0, 'Seniority score cannot be negative'],
  },
  kycStatus: {
    type: String,
    enum: ['PENDING', 'VERIFIED', 'REJECTED'],
    default: 'PENDING',
  },
  documents: [documentSchema],
}, {
  timestamps: true,
  toJSON: {
    transform: (doc, ret) => {
      const retAny = ret as any;
      // Remove sensitive fields unless explicitly requested
      if (!retAny._includeSensitiveData) {
        delete retAny.category;
      }
      delete retAny._includeSensitiveData;
      return ret;
    },
  },
});

// Indexes
studentSchema.index({ userId: 1 }, { unique: true });
studentSchema.index({ enrollmentNo: 1 }, { unique: true });
studentSchema.index({ year: 1, seniorityScore: -1 }); // For allocation rules
studentSchema.index({ kycStatus: 1 });
studentSchema.index({ category: 1 }); // For fee policies
studentSchema.index({ domicileState: 1 });
studentSchema.index({ createdAt: -1 });

// Compound indexes
studentSchema.index({ year: 1, semester: 1 });
studentSchema.index({ program: 1, year: 1 });
studentSchema.index({ category: 1, year: 1 }); // For reserved quotas

// Pre-save middleware
studentSchema.pre('save', function(next) {
  if (this.isModified('enrollmentNo')) {
    this.enrollmentNo = this.enrollmentNo.toUpperCase();
  }
  
  // Calculate seniority score if year changes
  if (this.isModified('year')) {
    this.seniorityScore = this.calculateSeniorityScore();
  }
  
  next();
});

// Static methods
studentSchema.statics.findByUserId = function(userId: string) {
  return this.findOne({ userId }).populate('userId', 'email fullName role');
};

studentSchema.statics.findByEnrollmentNo = function(enrollmentNo: string) {
  return this.findOne({ enrollmentNo: enrollmentNo.toUpperCase() });
};

studentSchema.statics.findByYear = function(year: number) {
  return this.find({ year }).sort({ seniorityScore: -1 });
};

studentSchema.statics.findByCategory = function(category: string) {
  return this.find({ category }).sort({ seniorityScore: -1 });
};

studentSchema.statics.findByKycStatus = function(kycStatus: string) {
  return this.find({ kycStatus });
};

studentSchema.statics.findEligibleForAllocation = function(criteria: any) {
  const query: any = { kycStatus: 'VERIFIED' };
  
  if (criteria.year) {
    query.year = { $in: Array.isArray(criteria.year) ? criteria.year : [criteria.year] };
  }
  
  if (criteria.program) {
    query.program = { $in: Array.isArray(criteria.program) ? criteria.program : [criteria.program] };
  }
  
  if (criteria.minSeniority) {
    query.seniorityScore = { $gte: criteria.minSeniority };
  }
  
  return this.find(query).sort({ seniorityScore: -1 });
};

// Instance methods
studentSchema.methods.calculateSeniorityScore = function(): number {
  // Base score from year
  let score = this.year * 100;
  
  // Additional points for higher semesters
  if (this.semester) {
    score += this.semester * 10;
  }
  
  // Additional points for verified KYC
  if (this.kycStatus === 'VERIFIED') {
    score += 50;
  }
  
  // Additional points for having documents
  if (this.documents && this.documents.length > 0) {
    score += this.documents.length * 5;
  }
  
  return score;
};

studentSchema.methods.updateSeniorityScore = function() {
  this.seniorityScore = this.calculateSeniorityScore();
  return this.save();
};

studentSchema.methods.verifyKyc = function(verifiedBy: string) {
  this.kycStatus = 'VERIFIED';
  this.verifiedAt = new Date();
  this.verifiedBy = verifiedBy;
  return this.save();
};

studentSchema.methods.rejectKyc = function(reason?: string) {
  this.kycStatus = 'REJECTED';
  this.verifiedAt = new Date();
  return this.save();
};

studentSchema.methods.addDocument = function(documentData: any) {
  this.documents.push(documentData);
  return this.save();
};

studentSchema.methods.verifyDocument = function(documentIndex: number, verifiedBy: string) {
  if (this.documents[documentIndex]) {
    this.documents[documentIndex].verified = true;
    this.documents[documentIndex].verifiedAt = new Date();
    this.documents[documentIndex].verifiedBy = verifiedBy;
  }
  return this.save();
};

studentSchema.methods.withSensitiveData = function() {
  this._includeSensitiveData = true;
  return this;
};

export const Student = mongoose.model<StudentDocument, StudentModel>('Student', studentSchema);
