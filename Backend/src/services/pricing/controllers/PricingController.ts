import { Request, Response } from 'express';
import { pricingService } from '../services/PricingService';
import { validateRequest, createFeePolicySchema, updateFeePolicySchema, paginationSchema, idParamSchema } from '../../../shared/utils/validation';
import { authenticate, requireAdmin, requireStaff } from '../../../shared/middleware/auth';
import { asyncHandler, successResponse, errorResponse } from '../../../shared/utils/errors';
import { pricingLogger } from '../../../shared/utils/logger';

export class PricingController {
  // Fee Policy Management
  public createFeePolicy = asyncHandler(async (req: Request, res: Response) => {
    const policy = await pricingService.createFeePolicy(req.validatedData, req.user!.userId);
    pricingLogger.logger.info('Fee policy created', { policyId: policy._id, createdBy: req.user?.userId });
    successResponse(res, policy, 'Fee policy created successfully', 201);
  });

  public getFeePolicyById = asyncHandler(async (req: Request, res: Response) => {
    const policy = await pricingService.getFeePolicyById(req.params.id);
    successResponse(res, policy, 'Fee policy retrieved successfully');
  });

  public updateFeePolicy = asyncHandler(async (req: Request, res: Response) => {
    const policy = await pricingService.updateFeePolicy(req.params.id, req.validatedData, req.user!.userId);
    pricingLogger.logger.info('Fee policy updated', { policyId: policy._id, updatedBy: req.user?.userId });
    successResponse(res, policy, 'Fee policy updated successfully');
  });

  public getFeePolicies = asyncHandler(async (req: Request, res: Response) => {
    const { page = 1, limit = 10, ...filters } = req.validatedData;
    const result = await pricingService.getFeePolicies(page, limit, filters);
    successResponse(res, result, 'Fee policies retrieved successfully');
  });

  public getActiveFeePolicies = asyncHandler(async (req: Request, res: Response) => {
    const policies = await pricingService.getActiveFeePolicies();
    successResponse(res, policies, 'Active fee policies retrieved successfully');
  });

  public getPoliciesForHostel = asyncHandler(async (req: Request, res: Response) => {
    const { hostelId } = req.params;
    const policies = await pricingService.getPoliciesForHostel(hostelId);
    successResponse(res, policies, 'Fee policies for hostel retrieved successfully');
  });

  public getPoliciesForRoomType = asyncHandler(async (req: Request, res: Response) => {
    const { hostelId, roomType } = req.params;
    const policies = await pricingService.getPoliciesForRoomType(hostelId, roomType);
    successResponse(res, policies, 'Fee policies for room type retrieved successfully');
  });

  // Fee Calculation
  public calculateFee = asyncHandler(async (req: Request, res: Response) => {
    const { hostelId, roomType } = req.params;
    const { studentData, duration = 1 } = req.body;

    if (!studentData) {
      return errorResponse(res, 'Student data is required', 400);
    }

    const calculation = await pricingService.calculateFee(hostelId, roomType, studentData, duration);
    pricingLogger.logger.info('Fee calculated', { 
      hostelId, 
      roomType, 
      totalAmount: calculation.totalAmount,
      calculatedBy: req.user?.userId 
    });
    successResponse(res, calculation, 'Fee calculated successfully');
  });

  public calculateFeeForMultipleRooms = asyncHandler(async (req: Request, res: Response) => {
    const { hostelId } = req.params;
    const { roomTypes, studentData, duration = 1 } = req.body;

    if (!roomTypes || !Array.isArray(roomTypes) || roomTypes.length === 0) {
      return errorResponse(res, 'Room types array is required', 400);
    }

    if (!studentData) {
      return errorResponse(res, 'Student data is required', 400);
    }

    const calculations = await pricingService.calculateFeeForMultipleRooms(hostelId, roomTypes, studentData, duration);
    pricingLogger.logger.info('Multiple room fees calculated', { 
      hostelId, 
      roomTypesCount: roomTypes.length,
      calculatedBy: req.user?.userId 
    });
    successResponse(res, calculations, 'Multiple room fees calculated successfully');
  });

  public calculateLateFee = asyncHandler(async (req: Request, res: Response) => {
    const { policyId } = req.params;
    const { amount, dueDate, paymentDate } = req.body;

    if (!amount || !dueDate || !paymentDate) {
      return errorResponse(res, 'Amount, due date, and payment date are required', 400);
    }

    const lateFeeCalculation = await pricingService.calculateLateFee(
      policyId, 
      amount, 
      new Date(dueDate), 
      new Date(paymentDate)
    );
    successResponse(res, lateFeeCalculation, 'Late fee calculated successfully');
  });

  public calculateRefund = asyncHandler(async (req: Request, res: Response) => {
    const { policyId } = req.params;
    const { amount } = req.body;

    if (!amount) {
      return errorResponse(res, 'Amount is required', 400);
    }

    const refundCalculation = await pricingService.calculateRefund(policyId, amount);
    successResponse(res, refundCalculation, 'Refund calculated successfully');
  });

  // Adjustment Management
  public addAdjustment = asyncHandler(async (req: Request, res: Response) => {
    const { policyId } = req.params;
    const { adjustment } = req.body;

    if (!adjustment) {
      return errorResponse(res, 'Adjustment data is required', 400);
    }

    const policy = await pricingService.addAdjustment(policyId, adjustment, req.user!.userId);
    pricingLogger.logger.info('Adjustment added', { 
      policyId: policy._id, 
      adjustmentType: adjustment.type,
      addedBy: req.user?.userId 
    });
    successResponse(res, policy, 'Adjustment added successfully');
  });

  public updateAdjustment = asyncHandler(async (req: Request, res: Response) => {
    const { policyId, adjustmentIndex } = req.params;
    const { updateData } = req.body;

    if (!updateData) {
      return errorResponse(res, 'Update data is required', 400);
    }

    const policy = await pricingService.updateAdjustment(
      policyId, 
      parseInt(adjustmentIndex), 
      updateData, 
      req.user!.userId
    );
    pricingLogger.logger.info('Adjustment updated', { 
      policyId: policy._id, 
      adjustmentIndex,
      updatedBy: req.user?.userId 
    });
    successResponse(res, policy, 'Adjustment updated successfully');
  });

  public removeAdjustment = asyncHandler(async (req: Request, res: Response) => {
    const { policyId, adjustmentIndex } = req.params;

    const policy = await pricingService.removeAdjustment(
      policyId, 
      parseInt(adjustmentIndex), 
      req.user!.userId
    );
    pricingLogger.logger.info('Adjustment removed', { 
      policyId: policy._id, 
      adjustmentIndex,
      removedBy: req.user?.userId 
    });
    successResponse(res, policy, 'Adjustment removed successfully');
  });

  // Bulk Operations
  public bulkUpdatePolicies = asyncHandler(async (req: Request, res: Response) => {
    const { updates } = req.body;

    if (!updates || !Array.isArray(updates) || updates.length === 0) {
      return errorResponse(res, 'Updates array is required', 400);
    }

    const updatedPolicies = await pricingService.bulkUpdatePolicies(updates, req.user!.userId);
    pricingLogger.logger.info('Bulk policy update completed', { 
      policiesCount: updatedPolicies.length,
      updatedBy: req.user?.userId 
    });
    successResponse(res, updatedPolicies, 'Bulk policy update completed successfully');
  });

  // Statistics and Analytics
  public getPricingStatistics = asyncHandler(async (req: Request, res: Response) => {
    const statistics = await pricingService.getPricingStatistics();
    successResponse(res, statistics, 'Pricing statistics retrieved successfully');
  });

  public getFeeComparison = asyncHandler(async (req: Request, res: Response) => {
    const { hostelId } = req.params;
    const { roomTypes, studentData, duration = 1 } = req.body;

    if (!roomTypes || !Array.isArray(roomTypes) || roomTypes.length === 0) {
      return errorResponse(res, 'Room types array is required', 400);
    }

    if (!studentData) {
      return errorResponse(res, 'Student data is required', 400);
    }

    const comparison = await pricingService.getFeeComparison(hostelId, roomTypes, studentData, duration);
    pricingLogger.logger.info('Fee comparison generated', { 
      hostelId, 
      roomTypesCount: roomTypes.length,
      comparedBy: req.user?.userId 
    });
    successResponse(res, comparison, 'Fee comparison generated successfully');
  });

  // Policy Validation
  public validatePolicy = asyncHandler(async (req: Request, res: Response) => {
    const validation = await pricingService.validatePolicy(req.body);
    successResponse(res, validation, 'Policy validation completed');
  });

  // Health Check
  public health = asyncHandler(async (req: Request, res: Response) => {
    successResponse(res, { status: 'healthy', service: 'pricing' }, 'Pricing Service is healthy');
  });
}

export const pricingController = new PricingController();
