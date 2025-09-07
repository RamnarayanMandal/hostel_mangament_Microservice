import { Request, Response } from 'express';
import { allocationService } from '../services/AllocationService';
import { validateRequest, createAllocationRuleSchema, updateAllocationRuleSchema, createAllocationRequestSchema, updateAllocationRequestSchema, paginationSchema, idParamSchema } from '../../../shared/utils/validation';
import { authenticate, requireAdmin, requireStaff } from '../../../shared/middleware/auth';
import { asyncHandler, successResponse, errorResponse } from '../../../shared/utils/errors';
import { allocationLogger } from '../../../shared/utils/logger';

export class AllocationController {
  // Allocation Rule Management
  public createAllocationRule = asyncHandler(async (req: Request, res: Response) => {
    const rule = await allocationService.createAllocationRule(req.validatedData, req.user!.userId);
    allocationLogger.logger.info('Allocation rule created', { ruleId: rule._id, createdBy: req.user?.userId });
    successResponse(res, rule, 'Allocation rule created successfully', 201);
  });

  public getAllocationRuleById = asyncHandler(async (req: Request, res: Response) => {
    const rule = await allocationService.getAllocationRuleById(req.params.id);
    successResponse(res, rule, 'Allocation rule retrieved successfully');
  });

  public updateAllocationRule = asyncHandler(async (req: Request, res: Response) => {
    const rule = await allocationService.updateAllocationRule(req.params.id, req.validatedData, req.user!.userId);
    allocationLogger.logger.info('Allocation rule updated', { ruleId: rule._id, updatedBy: req.user?.userId });
    successResponse(res, rule, 'Allocation rule updated successfully');
  });

  public getAllocationRules = asyncHandler(async (req: Request, res: Response) => {
    const { page = 1, limit = 10, ...filters } = req.validatedData;
    const result = await allocationService.getAllocationRules(page, limit, filters);
    successResponse(res, result, 'Allocation rules retrieved successfully');
  });

  public getActiveAllocationRules = asyncHandler(async (req: Request, res: Response) => {
    const rules = await allocationService.getActiveAllocationRules();
    successResponse(res, rules, 'Active allocation rules retrieved successfully');
  });

  public getRulesForStudent = asyncHandler(async (req: Request, res: Response) => {
    const { studentData } = req.body;
    if (!studentData) {
      return errorResponse(res, 'Student data is required', 400);
    }
    const rules = await allocationService.getRulesForStudent(studentData);
    successResponse(res, rules, 'Allocation rules for student retrieved successfully');
  });

  public getRulesForHostel = asyncHandler(async (req: Request, res: Response) => {
    const { hostelId } = req.params;
    const rules = await allocationService.getRulesForHostel(hostelId);
    successResponse(res, rules, 'Allocation rules for hostel retrieved successfully');
  });

  // Allocation Request Management
  public createAllocationRequest = asyncHandler(async (req: Request, res: Response) => {
    const request = await allocationService.createAllocationRequest(req.validatedData, req.user!.userId);
    allocationLogger.logger.info('Allocation request created', { requestId: request._id, studentId: req.user?.userId });
    successResponse(res, request, 'Allocation request created successfully', 201);
  });

  public getAllocationRequestById = asyncHandler(async (req: Request, res: Response) => {
    const request = await allocationService.getAllocationRequestById(req.params.id);
    successResponse(res, request, 'Allocation request retrieved successfully');
  });

  public updateAllocationRequest = asyncHandler(async (req: Request, res: Response) => {
    const request = await allocationService.updateAllocationRequest(req.params.id, req.validatedData, req.user!.userId);
    allocationLogger.logger.info('Allocation request updated', { requestId: request._id, updatedBy: req.user?.userId });
    successResponse(res, request, 'Allocation request updated successfully');
  });

  public getAllocationRequests = asyncHandler(async (req: Request, res: Response) => {
    const { page = 1, limit = 10, ...filters } = req.validatedData;
    const result = await allocationService.getAllocationRequests(page, limit, filters);
    successResponse(res, result, 'Allocation requests retrieved successfully');
  });

  public getRequestsByStudent = asyncHandler(async (req: Request, res: Response) => {
    const { studentId } = req.params;
    const requests = await allocationService.getRequestsByStudent(studentId);
    successResponse(res, requests, 'Allocation requests for student retrieved successfully');
  });

  public getRequestsByStatus = asyncHandler(async (req: Request, res: Response) => {
    const { status } = req.params;
    const requests = await allocationService.getRequestsByStatus(status);
    successResponse(res, requests, 'Allocation requests by status retrieved successfully');
  });

  public getPendingRequests = asyncHandler(async (req: Request, res: Response) => {
    const requests = await allocationService.getPendingRequests();
    successResponse(res, requests, 'Pending allocation requests retrieved successfully');
  });

  public getWaitlistedRequests = asyncHandler(async (req: Request, res: Response) => {
    const requests = await allocationService.getWaitlistedRequests();
    successResponse(res, requests, 'Waitlisted allocation requests retrieved successfully');
  });

  public getApprovedRequests = asyncHandler(async (req: Request, res: Response) => {
    const requests = await allocationService.getApprovedRequests();
    successResponse(res, requests, 'Approved allocation requests retrieved successfully');
  });

  // Request Processing
  public approveRequest = asyncHandler(async (req: Request, res: Response) => {
    const { requestId } = req.params;
    const { comments } = req.body;
    const request = await allocationService.approveRequest(requestId, req.user!.userId, comments);
    allocationLogger.logger.info('Allocation request approved', { requestId: request._id, approvedBy: req.user?.userId });
    successResponse(res, request, 'Allocation request approved successfully');
  });

  public rejectRequest = asyncHandler(async (req: Request, res: Response) => {
    const { requestId } = req.params;
    const { reason, comments } = req.body;
    if (!reason) {
      return errorResponse(res, 'Rejection reason is required', 400);
    }
    const request = await allocationService.rejectRequest(requestId, req.user!.userId, reason, comments);
    allocationLogger.logger.info('Allocation request rejected', { requestId: request._id, rejectedBy: req.user?.userId });
    successResponse(res, request, 'Allocation request rejected successfully');
  });

  public waitlistRequest = asyncHandler(async (req: Request, res: Response) => {
    const { requestId } = req.params;
    const { estimatedWaitTime } = req.body;
    const request = await allocationService.waitlistRequest(requestId, estimatedWaitTime);
    allocationLogger.logger.info('Allocation request waitlisted', { requestId: request._id, waitlistedBy: req.user?.userId });
    successResponse(res, request, 'Allocation request waitlisted successfully');
  });

  public allocateRequest = asyncHandler(async (req: Request, res: Response) => {
    const { requestId } = req.params;
    const { hostelId, roomId, bedId } = req.body;
    if (!hostelId || !roomId || !bedId) {
      return errorResponse(res, 'Hostel ID, Room ID, and Bed ID are required', 400);
    }
    const request = await allocationService.allocateRequest(requestId, hostelId, roomId, bedId, req.user!.userId);
    allocationLogger.logger.info('Allocation request allocated', { requestId: request._id, allocatedBy: req.user?.userId });
    successResponse(res, request, 'Allocation request allocated successfully');
  });

  public cancelRequest = asyncHandler(async (req: Request, res: Response) => {
    const { requestId } = req.params;
    const { reason } = req.body;
    const request = await allocationService.cancelRequest(requestId, req.user!.userId, reason);
    allocationLogger.logger.info('Allocation request cancelled', { requestId: request._id, cancelledBy: req.user?.userId });
    successResponse(res, request, 'Allocation request cancelled successfully');
  });

  // Document Management
  public addDocument = asyncHandler(async (req: Request, res: Response) => {
    const { requestId } = req.params;
    const { type, url } = req.body;
    if (!type || !url) {
      return errorResponse(res, 'Document type and URL are required', 400);
    }
    const request = await allocationService.addDocument(requestId, type, url);
    successResponse(res, request, 'Document added successfully');
  });

  public verifyDocument = asyncHandler(async (req: Request, res: Response) => {
    const { requestId, documentIndex } = req.params;
    const request = await allocationService.verifyDocument(requestId, parseInt(documentIndex), req.user!.userId);
    successResponse(res, request, 'Document verified successfully');
  });

  // Allocation Processing
  public processAllocation = asyncHandler(async (req: Request, res: Response) => {
    const { ruleId } = req.params;
    const result = await allocationService.processAllocation(ruleId);
    allocationLogger.logger.info('Allocation processing completed', { ruleId, result });
    successResponse(res, result, 'Allocation processing completed successfully');
  });

  // Statistics
  public getAllocationStatistics = asyncHandler(async (req: Request, res: Response) => {
    const statistics = await allocationService.getAllocationStatistics();
    successResponse(res, statistics, 'Allocation statistics retrieved successfully');
  });

  public health = asyncHandler(async (req: Request, res: Response) => {
    successResponse(res, { status: 'healthy', service: 'allocation' }, 'Allocation Service is healthy');
  });
}

export const allocationController = new AllocationController();
