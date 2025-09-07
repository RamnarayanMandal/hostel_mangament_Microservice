import mongoose, { Schema, Document } from 'mongoose';

export interface ReportInterface {
  reportId: string;
  name: string;
  type: 'OCCUPANCY' | 'REVENUE' | 'BOOKING' | 'PAYMENT' | 'STUDENT' | 'CUSTOM';
  category: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY' | 'CUSTOM';
  status: 'PENDING' | 'GENERATING' | 'COMPLETED' | 'FAILED';
  filters: {
    hostelId?: ObjectId;
    startDate?: Date;
    endDate?: Date;
    roomType?: string;
    status?: string;
    [key: string]: any;
  };
  data: any;
  format: 'JSON' | 'CSV' | 'PDF' | 'EXCEL';
  generatedBy: ObjectId;
  generatedAt?: Date;
  expiresAt?: Date;
  downloadUrl?: string;
  fileSize?: number;
  metadata?: Record<string, any>;
}

export interface ReportDocument extends Omit<ReportInterface, '_id'>, Document {}

const reportSchema = new Schema<ReportDocument>({
  reportId: { 
    type: String, 
    required: true, 
    unique: true,
    default: () => `RPT${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`
  },
  name: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['OCCUPANCY', 'REVENUE', 'BOOKING', 'PAYMENT', 'STUDENT', 'CUSTOM'],
    required: true 
  },
  category: { 
    type: String, 
    enum: ['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY', 'CUSTOM'],
    required: true 
  },
  status: { 
    type: String, 
    enum: ['PENDING', 'GENERATING', 'COMPLETED', 'FAILED'],
    default: 'PENDING' 
  },
  filters: { type: Schema.Types.Mixed, default: {} },
  data: { type: Schema.Types.Mixed },
  format: { 
    type: String, 
    enum: ['JSON', 'CSV', 'PDF', 'EXCEL'],
    default: 'JSON' 
  },
  generatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  generatedAt: { type: Date },
  expiresAt: { type: Date },
  downloadUrl: { type: String },
  fileSize: { type: Number },
  metadata: { type: Schema.Types.Mixed, default: {} }
}, { 
  timestamps: true 
});

// Indexes
reportSchema.index({ reportId: 1 });
reportSchema.index({ type: 1, category: 1 });
reportSchema.index({ generatedBy: 1 });
reportSchema.index({ status: 1 });
reportSchema.index({ generatedAt: 1 });
reportSchema.index({ expiresAt: 1 });

export const Report = mongoose.model<ReportDocument>('Report', reportSchema);

