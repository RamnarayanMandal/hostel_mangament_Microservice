import mongoose, { Schema, Document, Types } from 'mongoose';

export interface AuditLogInterface {
  action: string;
  entity: string;
  entityId: Types.ObjectId;
  userId: Types.ObjectId;
  userRole: string;
  changes?: {
    before?: any;
    after?: any;
    fields?: string[];
  };
  metadata: {
    ipAddress?: string;
    userAgent?: string;
    sessionId?: string;
    requestId?: string;
    [key: string]: any;
  };
  timestamp: Date;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface AuditLogDocument extends Omit<AuditLogInterface, '_id'>, Document {}

const auditLogSchema = new Schema<AuditLogDocument>({
  action: { type: String, required: true },
  entity: { type: String, required: true },
  entityId: { type: Schema.Types.ObjectId, required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  userRole: { type: String, required: true },
  changes: {
    before: { type: Schema.Types.Mixed },
    after: { type: Schema.Types.Mixed },
    fields: [{ type: String }]
  },
  metadata: { type: Schema.Types.Mixed, default: {} },
  timestamp: { type: Date, default: Date.now },
  severity: { 
    type: String, 
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    default: 'LOW' 
  }
}, { 
  timestamps: true 
});

// Indexes
auditLogSchema.index({ action: 1 });
auditLogSchema.index({ entity: 1, entityId: 1 });
auditLogSchema.index({ userId: 1 });
auditLogSchema.index({ timestamp: 1 });
auditLogSchema.index({ severity: 1 });
auditLogSchema.index({ 'metadata.requestId': 1 });

export const AuditLog = mongoose.model<AuditLogDocument>('AuditLog', auditLogSchema);

