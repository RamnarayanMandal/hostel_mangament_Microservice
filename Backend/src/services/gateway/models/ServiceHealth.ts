import mongoose, { Schema, Document } from 'mongoose';

export interface ServiceHealthInterface {
  serviceName: string;
  status: 'HEALTHY' | 'UNHEALTHY' | 'DEGRADED' | 'UNKNOWN';
  lastCheck: Date;
  responseTime: number;
  uptime: number;
  version: string;
  endpoints: Array<{
    path: string;
    method: string;
    status: 'UP' | 'DOWN';
    responseTime: number;
    lastCheck: Date;
  }>;
  metadata: {
    cpu?: number;
    memory?: number;
    disk?: number;
    activeConnections?: number;
    [key: string]: any;
  };
  errors: Array<{
    timestamp: Date;
    error: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  }>;
}

export interface ServiceHealthDocument extends Omit<ServiceHealthInterface, '_id' | 'errors'>, Document {}

const serviceHealthSchema = new Schema<ServiceHealthDocument>({
  serviceName: { type: String, required: true, unique: true },
  status: { 
    type: String, 
    enum: ['HEALTHY', 'UNHEALTHY', 'DEGRADED', 'UNKNOWN'],
    default: 'UNKNOWN' 
  },
  lastCheck: { type: Date, default: Date.now },
  responseTime: { type: Number, default: 0 },
  uptime: { type: Number, default: 0 },
  version: { type: String, default: '1.0.0' },
  endpoints: [{
    path: { type: String, required: true },
    method: { type: String, required: true },
    status: { 
      type: String, 
      enum: ['UP', 'DOWN'],
      default: 'DOWN' 
    },
    responseTime: { type: Number, default: 0 },
    lastCheck: { type: Date, default: Date.now }
  }],
  metadata: { type: Schema.Types.Mixed, default: {} }
}, { 
  timestamps: true 
});

// Indexes
serviceHealthSchema.index({ serviceName: 1 }, { unique: true });
serviceHealthSchema.index({ status: 1 });
serviceHealthSchema.index({ lastCheck: 1 });

export const ServiceHealth = mongoose.model<ServiceHealthDocument>('ServiceHealth', serviceHealthSchema);
