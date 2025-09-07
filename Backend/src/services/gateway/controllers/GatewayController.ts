import { Request, Response } from 'express';
import { GatewayService } from '../services/GatewayService';
import { successResponse, errorResponse } from '../../../shared/utils/errors';

export class GatewayController {
  private gatewayService: GatewayService;

  constructor() {
    this.gatewayService = new GatewayService();
  }

  // Health check
  public health = async (req: Request, res: Response) => {
    try {
      return successResponse(res, { status: 'healthy', service: 'gateway' }, 'Gateway is healthy');
    } catch (error) {
      return errorResponse(res, 'Health check failed', 500);
    }
  };

  // Service Health Management
  public getServiceHealth = async (req: Request, res: Response) => {
    try {
      const { serviceName } = req.validatedData;
      const health = await this.gatewayService.getServiceHealth(serviceName);
      return successResponse(res, health, 'Service health retrieved successfully');
    } catch (error) {
      return errorResponse(res, 'Failed to retrieve service health', 404);
    }
  };

  public updateServiceHealth = async (req: Request, res: Response) => {
    try {
      const { serviceName, ...healthData } = req.validatedData;
      await this.gatewayService.updateServiceHealth(serviceName, healthData);
      return successResponse(res, null, 'Service health updated successfully');
    } catch (error) {
      return errorResponse(res, 'Failed to update service health', 400);
    }
  };

  // Statistics
  public getGatewayStatistics = async (req: Request, res: Response) => {
    try {
      const { period = '24h' } = req.validatedData;
      const endDate = new Date();
      const startDate = new Date();
      
      // Calculate start date based on period
      switch (period) {
        case '1h':
          startDate.setHours(endDate.getHours() - 1);
          break;
        case '24h':
          startDate.setDate(endDate.getDate() - 1);
          break;
        case '7d':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(endDate.getDate() - 30);
          break;
      }
      
      const stats = await this.gatewayService.getRequestStatistics({ start: startDate, end: endDate });
      return successResponse(res, stats, 'Gateway statistics retrieved successfully');
    } catch (error) {
      return errorResponse(res, 'Failed to retrieve gateway statistics', 500);
    }
  };
}

export const gatewayController = new GatewayController();
