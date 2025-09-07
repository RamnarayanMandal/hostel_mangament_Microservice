import mongoose, { Schema, Document } from 'mongoose';

export interface AdminInterface {
  userId: ObjectId;
  role: 'SUPER_ADMIN' | 'HOSTEL_ADMIN' | 'STAFF' | 'ACCOUNTANT';
  permissions: string[];
  assignedHostels: ObjectId[];
  department?: string;
  isActive: boolean;
  lastLoginAt?: Date;
  preferences: {
    dashboardLayout?: string;
    notificationsEnabled: boolean;
    emailReports: boolean;
  };
}

export interface AdminDocument extends Omit<AdminInterface, '_id'>, Document {}

const adminSchema = new Schema<AdminDocument>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  role: { 
    type: String, 
    enum: ['SUPER_ADMIN', 'HOSTEL_ADMIN', 'STAFF', 'ACCOUNTANT'],
    required: true 
  },
  permissions: [{ type: String }],
  assignedHostels: [{ type: Schema.Types.ObjectId, ref: 'Hostel' }],
  department: { type: String },
  isActive: { type: Boolean, default: true },
  lastLoginAt: { type: Date },
  preferences: {
    dashboardLayout: { type: String, default: 'default' },
    notificationsEnabled: { type: Boolean, default: true },
    emailReports: { type: Boolean, default: false }
  }
}, { 
  timestamps: true 
});

// Indexes
adminSchema.index({ userId: 1 });
adminSchema.index({ role: 1 });
adminSchema.index({ assignedHostels: 1 });
adminSchema.index({ isActive: 1 });

export const Admin = mongoose.model<AdminDocument>('Admin', adminSchema);

