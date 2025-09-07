import mongoose, { Schema, Document } from 'mongoose';

export interface RequestLogInterface {
  requestId: string;
  method: string;
  path: string;
  service: string;
  targetUrl: string;
  statusCode: number;
  responseTime: number;
  requestSize: number;
  responseSize: number;
  userAgent: string;
  ipAddress: string;
  userId?: string;
  userRole?: string;
  headers: Record<string, string>;
  queryParams: Record<string, any>;
  requestBody?: any;
  responseBody?: any;
  error?: {
    message: string;
    stack?: string;
    code?: string;
  };
  metadata: {
    correlationId?: string;
    sessionId?: string;
    clientId?: string;
    [key: string]: any;
  };
  timestamp: Date;
}

export interface RequestLogDocument extends Omit<RequestLogInterface, '_id'>, Document {}

const requestLogSchema = new Schema<RequestLogDocument>({
  requestId: { type: String, required: true, unique: true },
  method: { type: String, required: true },
  path: { type: String, required: true },
  service: { type: String, required: true },
  targetUrl: { type: String, required: true },
  statusCode: { type: Number, required: true },
  responseTime: { type: Number, required: true },
  requestSize: { type: Number, default: 0 },
  responseSize: { type: Number, default: 0 },
  userAgent: { type: String, default: '' },
  ipAddress: { type: String, required: true },
  userId: { type: String },
  userRole: { type: String },
  headers: { type: Schema.Types.Mixed, default: {} },
  queryParams: { type: Schema.Types.Mixed, default: {} },
  requestBody: { type: Schema.Types.Mixed },
  responseBody: { type: Schema.Types.Mixed },
  error: {
    message: { type: String },
    stack: { type: String },
    code: { type: String }
  },
  metadata: { type: Schema.Types.Mixed, default: {} },
  timestamp: { type: Date, default: Date.now }
}, { 
  timestamps: true 
});

// Indexes
requestLogSchema.index({ requestId: 1 }, { unique: true });
requestLogSchema.index({ timestamp: -1 });
requestLogSchema.index({ service: 1 });
requestLogSchema.index({ statusCode: 1 });
requestLogSchema.index({ userId: 1 });
requestLogSchema.index({ path: 1 });
requestLogSchema.index({ 'metadata.correlationId': 1 });

export const RequestLog = mongoose.model<RequestLogDocument>('RequestLog', requestLogSchema);
