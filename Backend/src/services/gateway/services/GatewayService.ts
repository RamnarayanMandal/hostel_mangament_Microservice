import axios, { AxiosResponse, AxiosError } from 'axios';
import { Route, RouteDocument } from '../models/Route';
import { RequestLog, RequestLogDocument } from '../models/RequestLog';
import { ServiceHealth, ServiceHealthDocument } from '../models/ServiceHealth';
import { getRedisConnection } from '../../../shared/config/redis';
import { gatewayLogger } from '../../../shared/utils/logger';
import { v4 as uuidv4 } from 'uuid';
import { JWTPayload } from '../../../types';
import { getRouteConfig } from '../config/routes';

export interface ProxyRequest {
  method: string;
  path: string;
  headers: Record<string, string>;
  query: Record<string, any>;
  body?: any;
  user?: JWTPayload;
  ip: string;
  userAgent: string;
}

export interface ProxyResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: any;
  responseTime: number;
}

export class GatewayService {
  private redis = getRedisConnection();

  /**
   * Route request to appropriate microservice
   */
  public async routeRequest(request: ProxyRequest): Promise<ProxyResponse> {
    const startTime = Date.now();
    const requestId = uuidv4();
    
    try {
      // Find route configuration
      const route = await this.findRoute(request.method, request.path);
      if (!route) {
        gatewayLogger.logger.error('Route not found', { 
          method: request.method, 
          path: request.path
        });
        return this.createErrorResponse(404, `Route not found: ${request.method} ${request.path}`);
      }

      // Check authentication
      if (route.authentication.required) {
        const authResult = await this.authenticateRequest(request, route);
        if (!authResult.authenticated) {
          return this.createErrorResponse(401, 'Authentication required');
        }
        if (route.authentication.roles && route.authentication.roles.length > 0) {
          if (!route.authentication.roles.includes(authResult.user?.role || '')) {
            return this.createErrorResponse(403, 'Insufficient permissions');
          }
        }
      }

      // Check rate limiting
      const rateLimitResult = await this.checkRateLimit(request, route);
      if (!rateLimitResult.allowed) {
        return this.createErrorResponse(429, 'Rate limit exceeded');
      }

      // Check caching
      if (route.caching.enabled && request.method === 'GET') {
        const cachedResponse = await this.getCachedResponse(request, route);
        if (cachedResponse) {
          await this.logRequest(requestId, request, route, 200, Date.now() - startTime);
          return cachedResponse;
        }
      }

      // Transform request
      const transformedRequest = await this.transformRequest(request, route);

      // Forward request to target service
      const response = await this.forwardRequest(transformedRequest, route);

      // Transform response
      const transformedResponse = await this.transformResponse(response, route);

      // Cache response if enabled
      if (route.caching.enabled && request.method === 'GET' && response.status >= 200 && response.status < 300) {
        await this.cacheResponse(request, route, transformedResponse);
      }

      // Log request
      await this.logRequest(requestId, request, route, response.status, Date.now() - startTime);

      return transformedResponse;

    } catch (error) {
      const responseTime = Date.now() - startTime;
      await this.logRequest(requestId, request, null, 500, responseTime, error as Error);
      
      if (error instanceof AxiosError) {
        return this.createErrorResponse(error.response?.status || 500, error.message);
      }
      
      return this.createErrorResponse(500, 'Internal server error');
    }
  }

  /**
   * Find route configuration
   */
  private async findRoute(method: string, path: string): Promise<RouteDocument | null> {
    try {
      // Strip /api prefix if present for route matching
      const routePath = path.startsWith('/api') ? path.substring(4) : path;
      
      gatewayLogger.logger.info('Finding route', { method, originalPath: path, routePath });
      
      // Try to find route with the processed path
      let defaultRoute = this.getDefaultRoute(method, routePath);
      
      // If not found, try with the original path
      if (!defaultRoute) {
        defaultRoute = this.getDefaultRoute(method, path);
      }
      
      gatewayLogger.logger.info('Using default route', { 
        defaultRoute: defaultRoute?.path || 'null',
        found: !!defaultRoute,
        routeKey: `${method.toUpperCase()}:${routePath}`,
        originalRouteKey: `${method.toUpperCase()}:${path}`
      });
      return defaultRoute;
    } catch (error) {
      gatewayLogger.logger.error('Error finding route', { error: (error as Error).message, method, path });
      return this.getDefaultRoute(method, path.startsWith('/api') ? path.substring(4) : path);
    }
  }

  /**
   * Get default route configuration
   */
  private getDefaultRoute(method: string, path: string): RouteDocument | null {
    gatewayLogger.logger.info('Getting default route', { method, path });
    
    // Normalize the path to ensure consistent matching
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    
    gatewayLogger.logger.info('Path normalization', { originalPath: path, normalizedPath });
    
    // Use the centralized route configuration
    const routeConfig = getRouteConfig(method, normalizedPath);
    
    gatewayLogger.logger.info('Route lookup result', { 
      method, 
      path: normalizedPath, 
      found: !!routeConfig,
      service: routeConfig?.service || 'none'
    });
    
    return routeConfig;
  }

  /**
   * Authenticate request
   */
  private async authenticateRequest(request: ProxyRequest, route: RouteDocument): Promise<{ authenticated: boolean; user?: JWTPayload }> {
    try {
      const authHeader = request.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return { authenticated: false };
      }

      const token = authHeader.substring(7);
      
      // Import jwtService dynamically to avoid circular dependencies
      const { jwtService } = await import('../../../shared/utils/jwt');
      const decoded = jwtService.verifyAccessToken(token);

      return { authenticated: true, user: decoded };
    } catch (error) {
      gatewayLogger.logger.error('Authentication error', { error: (error as Error).message });
      return { authenticated: false };
    }
  }

  /**
   * Check rate limiting
   */
  private async checkRateLimit(request: ProxyRequest, route: RouteDocument): Promise<{ allowed: boolean }> {
    try {
      const redis = await this.redis;
      if (!redis) {
        return { allowed: true }; // Allow if Redis is not available
      }
      
      const key = `rate_limit:${request.ip}:${route.path}:${route.method}`;
      const current = await redis.incr(key);
      
      if (current === 1) {
        await redis.expire(key, Math.floor(route.rateLimit.windowMs / 1000));
      }

      return { allowed: current <= route.rateLimit.maxRequests };
    } catch (error) {
      gatewayLogger.logger.error('Rate limit check error', { error: (error as Error).message });
      return { allowed: true }; // Allow if rate limiting fails
    }
  }

  /**
   * Get cached response
   */
  private async getCachedResponse(request: ProxyRequest, route: RouteDocument): Promise<ProxyResponse | null> {
    try {
      const redis = await this.redis;
      if (!redis) {
        return null; // Return null if Redis is not available
      }
      
      const cacheKey = route.caching.key || `cache:${request.method}:${request.path}:${JSON.stringify(request.query)}`;
      const cached = await redis.get(cacheKey);
      
      if (cached) {
        return JSON.parse(cached);
      }
      
      return null;
    } catch (error) {
      gatewayLogger.logger.error('Cache get error', { error: (error as Error).message });
      return null;
    }
  }

  /**
   * Cache response
   */
  private async cacheResponse(request: ProxyRequest, route: RouteDocument, response: ProxyResponse): Promise<void> {
    try {
      const redis = await this.redis;
      if (!redis) {
        return; // Skip caching if Redis is not available
      }
      
      const cacheKey = route.caching.key || `cache:${request.method}:${request.path}:${JSON.stringify(request.query)}`;
      await redis.setex(cacheKey, route.caching.ttl, JSON.stringify(response));
    } catch (error) {
      gatewayLogger.logger.error('Cache set error', { error: (error as Error).message });
    }
  }

  /**
   * Transform request
   */
  private async transformRequest(request: ProxyRequest, route: RouteDocument): Promise<ProxyRequest> {
    const transformed = { ...request };
    
    // Add transformed headers
    if (route.transformation.request?.headers) {
      transformed.headers = { ...transformed.headers, ...route.transformation.request.headers };
    }

    // Add transformed body
    if (route.transformation.request?.body) {
      transformed.body = { ...transformed.body, ...route.transformation.request.body };
    }

    return transformed;
  }

  /**
   * Transform response
   */
  private async transformResponse(response: AxiosResponse, route: RouteDocument): Promise<ProxyResponse> {
    const transformed: ProxyResponse = {
      statusCode: response.status,
      headers: response.headers as Record<string, string>,
      body: response.data,
      responseTime: 0
    };

    // Add transformed headers
    if (route.transformation.response?.headers) {
      transformed.headers = { ...transformed.headers, ...route.transformation.response.headers };
    }

    // Add transformed body
    if (route.transformation.response?.body) {
      transformed.body = { ...transformed.body, ...route.transformation.response.body };
    }

    return transformed;
  }

  /**
   * Forward request to target service
   */
  private async forwardRequest(request: ProxyRequest, route: RouteDocument): Promise<AxiosResponse> {
    try {
      // For admin service, the targetUrl already includes the full path
      // So we should use the targetUrl directly without appending the path
      let url: string;
      
      if (route.service === 'admin-service') {
        // Admin service targetUrl already includes the full path (e.g., /api/admin/users)
        url = route.targetUrl;
      } else {
        // For other services, transform the path and append to base URL
      let targetPath = request.path;
      
      // Map gateway paths to service paths
      if (route.service === 'auth-service') {
        targetPath = `/api${request.path}`;
      } else if (route.service === 'student-service') {
        targetPath = `/api${request.path}`;
      } else if (route.service === 'hostel-service') {
        targetPath = `/api${request.path}`;
      } else if (route.service === 'booking-service') {
        targetPath = `/api${request.path}`;
      } else if (route.service === 'payment-service') {
        targetPath = `/api${request.path}`;
      } else if (route.service === 'test-service') {
        targetPath = request.path;
        }
        
        url = `${route.targetUrl}${targetPath}`;
      }
      
      // Log the path transformation for debugging
      gatewayLogger.logger.info('Path transformation', {
        originalPath: request.path,
        targetUrl: url,
        service: route.service
      });
      
      gatewayLogger.logger.info('Forwarding request', { 
        originalPath: request.path, 
        targetUrl: url,
        service: route.service 
      });
      
      const config = {
        method: request.method,
        url,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': request.headers['user-agent'] || 'Gateway-Service',
          ...(request.headers.authorization && { 'Authorization': request.headers.authorization })
        },
        params: request.query,
        data: request.body,
        timeout: 10000, // 10 seconds timeout
        validateStatus: () => true // Don't throw on HTTP error status
      };

      gatewayLogger.logger.info('Making axios request', {
        method: config.method,
        url: config.url,
        timeout: config.timeout,
        hasBody: !!config.data
      });

      // Simple axios request with timeout
      return axios(config);
    } catch (error) {
      gatewayLogger.logger.error('Error forwarding request', { 
        error: (error as Error).message, 
        service: route.service,
        targetUrl: route.targetUrl,
        method: request.method
      });
      throw error;
    }
  }

  /**
   * Log request
   */
  private async logRequest(
    requestId: string, 
    request: ProxyRequest, 
    route: RouteDocument | null, 
    statusCode: number, 
    responseTime: number, 
    error?: Error
  ): Promise<void> {
    try {
      const logData = {
        requestId,
        method: request.method,
        path: request.path,
        service: route?.service || 'unknown',
        targetUrl: route?.targetUrl || '',
        statusCode,
        responseTime,
        requestSize: JSON.stringify(request.body || {}).length,
        responseSize: 0, // Would be set from actual response
        userAgent: request.userAgent,
        ipAddress: request.ip,
        userId: request.user?.id,
        userRole: request.user?.role,
        headers: request.headers,
        queryParams: request.query,
        requestBody: request.body,
        error: error ? {
          message: error.message,
          stack: error.stack,
          code: (error as any).code
        } : undefined,
        metadata: {
          correlationId: requestId
        },
        timestamp: new Date()
      };

      await RequestLog.create(logData);
    } catch (error) {
      gatewayLogger.logger.error('Error logging request', { error: (error as Error).message });
    }
  }

  /**
   * Create error response
   */
  private createErrorResponse(statusCode: number, message: string): ProxyResponse {
    return {
      statusCode,
      headers: { 'Content-Type': 'application/json' },
      body: { error: message },
      responseTime: 0
    };
  }

  /**
   * Get service health status
   */
  public async getServiceHealth(serviceName: string): Promise<ServiceHealthDocument | null> {
    try {
      return await ServiceHealth.findOne({ serviceName });
    } catch (error) {
      gatewayLogger.logger.error('Error getting service health', { error: (error as Error).message, serviceName });
      return null;
    }
  }

  /**
   * Update service health status
   */
  public async updateServiceHealth(serviceName: string, healthData: Partial<ServiceHealthDocument>): Promise<void> {
    try {
      await ServiceHealth.findOneAndUpdate(
        { serviceName },
        { ...healthData, lastCheck: new Date() },
        { upsert: true, new: true }
      );
    } catch (error) {
      gatewayLogger.logger.error('Error updating service health', { error: (error as Error).message, serviceName });
    }
  }

  /**
   * Get request statistics
   */
  public async getRequestStatistics(timeRange: { start: Date; end: Date }): Promise<any> {
    try {
      const stats = await RequestLog.aggregate([
        {
          $match: {
            timestamp: { $gte: timeRange.start, $lte: timeRange.end }
          }
        },
        {
          $group: {
            _id: {
              service: '$service',
              statusCode: '$statusCode'
            },
            count: { $sum: 1 },
            avgResponseTime: { $avg: '$responseTime' },
            maxResponseTime: { $max: '$responseTime' },
            minResponseTime: { $min: '$responseTime' }
          }
        },
        {
          $group: {
            _id: '$_id.service',
            statusCodes: {
              $push: {
                statusCode: '$_id.statusCode',
                count: '$count',
                avgResponseTime: '$avgResponseTime',
                maxResponseTime: '$maxResponseTime',
                minResponseTime: '$minResponseTime'
              }
            },
            totalRequests: { $sum: '$count' },
            avgResponseTime: { $avg: '$avgResponseTime' }
          }
        }
      ]);

      return stats;
    } catch (error) {
      gatewayLogger.logger.error('Error getting request statistics', { error: (error as Error).message });
      return [];
    }
  }
}

export const gatewayService = new GatewayService();
