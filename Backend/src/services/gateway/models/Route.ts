import mongoose, { Schema, Document } from 'mongoose';

export interface RouteInterface {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  service: string;
  targetUrl: string;
  timeout: number;
  retries: number;
  rateLimit: {
    windowMs: number;
    maxRequests: number;
  };
  authentication: {
    required: boolean;
    roles?: string[];
  };
  caching: {
    enabled: boolean;
    ttl: number;
    key?: string;
  };
  transformation: {
    request?: {
      headers?: Record<string, string>;
      body?: Record<string, any>;
    };
    response?: {
      headers?: Record<string, string>;
      body?: Record<string, any>;
    };
  };
  isActive: boolean;
  metadata?: Record<string, any>;
}

export interface RouteDocument extends Omit<RouteInterface, '_id'>, Document {}

const routeSchema = new Schema<RouteDocument>({
  path: { type: String, required: true },
  method: { 
    type: String, 
    enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    required: true 
  },
  service: { type: String, required: true },
  targetUrl: { type: String, required: true },
  timeout: { type: Number, default: 50000 }, // 30 seconds
  retries: { type: Number, default: 3 },
  rateLimit: {
    windowMs: { type: Number, default: 15 * 60 * 1000 }, // 15 minutes
    maxRequests: { type: Number, default: 100 }
  },
  authentication: {
    required: { type: Boolean, default: true },
    roles: [{ type: String }]
  },
  caching: {
    enabled: { type: Boolean, default: false },
    ttl: { type: Number, default: 300 }, // 5 minutes
    key: { type: String }
  },
  transformation: {
    request: {
      headers: { type: Schema.Types.Mixed, default: {} },
      body: { type: Schema.Types.Mixed, default: {} }
    },
    response: {
      headers: { type: Schema.Types.Mixed, default: {} },
      body: { type: Schema.Types.Mixed, default: {} }
    }
  },
  isActive: { type: Boolean, default: true },
  metadata: { type: Schema.Types.Mixed, default: {} }
}, { 
  timestamps: true 
});

// Indexes
routeSchema.index({ path: 1, method: 1 }, { unique: true });
routeSchema.index({ service: 1 });
routeSchema.index({ isActive: 1 });

export const Route = mongoose.model<RouteDocument>('Route', routeSchema);
