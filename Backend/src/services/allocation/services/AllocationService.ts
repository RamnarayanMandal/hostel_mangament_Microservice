import { AllocationRule, AllocationRuleDocument } from '../models/AllocationRule';
import { AllocationRequest, AllocationRequestDocument } from '../models/AllocationRequest';
import { CreateAllocationRuleInput, UpdateAllocationRuleInput, CreateAllocationRequestInput, UpdateAllocationRequestInput } from '../../../shared/utils/validation';
import { ConflictError, NotFoundError, ValidationError } from '../../../shared/utils/errors';
import { getMessageBroker, EVENT_TYPES } from '../../../shared/config/message-broker';
import { allocationLogger } from '../../../shared/utils/logger';
import { v4 as uuidv4 } from 'uuid';

export class AllocationService {
  private messageBroker = getMessageBroker();

  // Allocation Rule Management
  public async createAllocationRule(ruleData: CreateAllocationRuleInput, createdBy: string): Promise<AllocationRuleDocument> {
    try {
      const rule = new AllocationRule({
        ...ruleData,
        createdBy,
        schedule: {
          startDate: new Date(ruleData.schedule.startDate),
          endDate: new Date(ruleData.schedule.endDate),
          applicationDeadline: new Date(ruleData.schedule.applicationDeadline),
          allocationStartDate: new Date(ruleData.schedule.allocationStartDate),
          allocationEndDate: new Date(ruleData.schedule.allocationEndDate)
        }
      });

      await rule.save();
      
      allocationLogger.logger.info('Allocation rule created', { 
        ruleId: rule._id, 
        name: rule.name,
        createdBy 
      });

      return rule;
    } catch (error: any) {
      if (error.code === 11000) {
        throw new ConflictError('Allocation rule with this name already exists');
      }
      throw error;
    }
  }

  public async getAllocationRuleById(ruleId: string): Promise<AllocationRuleDocument> {
    const rule = await AllocationRule.findById(ruleId);
    if (!rule) {
      throw new NotFoundError('Allocation rule not found');
    }
    return rule;
  }

  public async updateAllocationRule(ruleId: string, updateData: UpdateAllocationRuleInput, updatedBy: string): Promise<AllocationRuleDocument> {
    const rule = await this.getAllocationRuleById(ruleId);
    
    // Convert date strings to Date objects if provided
    if (updateData.schedule) {
      Object.keys(updateData.schedule).forEach(key => {
        const value = (updateData.schedule as any)[key];
        if (value && typeof value === 'string') {
          (updateData.schedule as any)[key] = new Date(value);
        }
      });
    }

    Object.assign(rule, updateData, { updatedBy });
    await rule.save();

    allocationLogger.logger.info('Allocation rule updated', { 
      ruleId: rule._id, 
      updatedBy 
    });

    return rule;
  }

  public async getAllocationRules(page: number = 1, limit: number = 10, filters: any = {}): Promise<{ rules: AllocationRuleDocument[]; total: number; page: number; limit: number; totalPages: number }> {
    const query: any = {};
    
    if (filters.isActive !== undefined) {
      query.isActive = filters.isActive;
    }
    if (filters.priority) {
      query.priority = filters.priority;
    }
    if (filters.hostelId) {
      query['allocation.hostelIds'] = filters.hostelId;
    }

    const skip = (page - 1) * limit;
    const [rules, total] = await Promise.all([
      AllocationRule.find(query).sort({ priority: -1, createdAt: -1 }).skip(skip).limit(limit),
      AllocationRule.countDocuments(query)
    ]);

    return {
      rules,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  public async getActiveAllocationRules(): Promise<AllocationRuleDocument[]> {
    return AllocationRule.findActiveRules();
  }

  public async getRulesForStudent(studentData: any): Promise<AllocationRuleDocument[]> {
    return AllocationRule.findRulesForStudent(studentData);
  }

  public async getRulesForHostel(hostelId: string): Promise<AllocationRuleDocument[]> {
    return AllocationRule.findRulesForHostel(hostelId);
  }

  // Allocation Request Management
  public async createAllocationRequest(requestData: CreateAllocationRequestInput, studentId: string): Promise<AllocationRequestDocument> {
    // Check if request already exists
    const existingRequest = await AllocationRequest.findByStudentAndRule(studentId, requestData.allocationRuleId);
    if (existingRequest) {
      throw new ConflictError('Allocation request already exists for this student and rule');
    }

    // Validate allocation rule exists and is active
    const rule = await this.getAllocationRuleById(requestData.allocationRuleId);
    if (!rule.isCurrentlyActive()) {
      throw new ValidationError('Allocation rule is not currently active');
    }

    if (!rule.canApply()) {
      throw new ValidationError('Application deadline has passed for this allocation rule');
    }

    const request = new AllocationRequest({
      ...requestData,
      studentId,
      metadata: {
        applicationSource: 'WEB',
        ipAddress: '127.0.0.1', // This should come from request context
        userAgent: 'Unknown', // This should come from request context
        sessionId: uuidv4()
      }
    });

    await request.save();

    allocationLogger.logger.info('Allocation request created', { 
      requestId: request._id, 
      studentId,
      ruleId: requestData.allocationRuleId
    });

    // Publish event
    await this.messageBroker.publishEvent({
      type: EVENT_TYPES.ALLOCATION_REQUEST_CREATED,
      data: {
        requestId: request._id,
        studentId,
        allocationRuleId: requestData.allocationRuleId,
        status: request.status
      },
      correlationId: uuidv4(),
      timestamp: new Date()
    });

    return request;
  }

  public async getAllocationRequestById(requestId: string): Promise<AllocationRequestDocument> {
    const request = await AllocationRequest.findById(requestId);
    if (!request) {
      throw new NotFoundError('Allocation request not found');
    }
    return request;
  }

  public async updateAllocationRequest(requestId: string, updateData: UpdateAllocationRequestInput, updatedBy: string): Promise<AllocationRequestDocument> {
    const request = await this.getAllocationRequestById(requestId);
    
    Object.assign(request, updateData);
    await request.save();

    allocationLogger.logger.info('Allocation request updated', { 
      requestId: request._id, 
      updatedBy,
      newStatus: updateData.status
    });

    return request;
  }

  public async getAllocationRequests(page: number = 1, limit: number = 10, filters: any = {}): Promise<{ requests: AllocationRequestDocument[]; total: number; page: number; limit: number; totalPages: number }> {
    const query: any = {};
    
    if (filters.status) {
      query.status = filters.status;
    }
    if (filters.studentId) {
      query.studentId = filters.studentId;
    }
    if (filters.allocationRuleId) {
      query.allocationRuleId = filters.allocationRuleId;
    }

    const skip = (page - 1) * limit;
    const [requests, total] = await Promise.all([
      AllocationRequest.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      AllocationRequest.countDocuments(query)
    ]);

    return {
      requests,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  public async getRequestsByStudent(studentId: string): Promise<AllocationRequestDocument[]> {
    return AllocationRequest.find({ studentId }).sort({ createdAt: -1 });
  }

  public async getRequestsByStatus(status: string): Promise<AllocationRequestDocument[]> {
    return AllocationRequest.findRequestsByStatus(status);
  }

  public async getPendingRequests(): Promise<AllocationRequestDocument[]> {
    return AllocationRequest.findPendingRequests();
  }

  public async getWaitlistedRequests(): Promise<AllocationRequestDocument[]> {
    return AllocationRequest.findWaitlistedRequests();
  }

  public async getApprovedRequests(): Promise<AllocationRequestDocument[]> {
    return AllocationRequest.findApprovedRequests();
  }

  // Request Processing
  public async approveRequest(requestId: string, reviewedBy: string, comments?: string): Promise<AllocationRequestDocument> {
    const request = await this.getAllocationRequestById(requestId);
    
    if (request.status !== 'PENDING') {
      throw new ValidationError('Only pending requests can be approved');
    }

    request.approve(reviewedBy, comments);
    await request.save();

    allocationLogger.logger.info('Allocation request approved', { 
      requestId: request._id, 
      reviewedBy 
    });

    return request;
  }

  public async rejectRequest(requestId: string, reviewedBy: string, reason: string, comments?: string): Promise<AllocationRequestDocument> {
    const request = await this.getAllocationRequestById(requestId);
    
    if (request.status !== 'PENDING') {
      throw new ValidationError('Only pending requests can be rejected');
    }

    request.reject(reviewedBy, reason, comments);
    await request.save();

    allocationLogger.logger.info('Allocation request rejected', { 
      requestId: request._id, 
      reviewedBy,
      reason 
    });

    return request;
  }

  public async waitlistRequest(requestId: string, estimatedWaitTime?: number): Promise<AllocationRequestDocument> {
    const request = await this.getAllocationRequestById(requestId);
    
    if (!request.canBeWaitlisted()) {
      throw new ValidationError('Request cannot be waitlisted');
    }

    const position = await AllocationRequest.getWaitlistPosition(request.allocationRuleId);
    request.waitlist(position + 1, estimatedWaitTime);
    await request.save();

    allocationLogger.logger.info('Allocation request waitlisted', { 
      requestId: request._id, 
      position: position + 1 
    });

    return request;
  }

  public async allocateRequest(requestId: string, hostelId: string, roomId: string, bedId: string, allocatedBy: string): Promise<AllocationRequestDocument> {
    const request = await this.getAllocationRequestById(requestId);
    
    if (!request.isEligibleForAllocation()) {
      throw new ValidationError('Request is not eligible for allocation');
    }

    request.allocate(hostelId, roomId, bedId, allocatedBy);
    await request.save();

    allocationLogger.logger.info('Allocation request allocated', { 
      requestId: request._id, 
      allocatedBy,
      hostelId,
      roomId,
      bedId 
    });

    // Publish allocation event
    await this.messageBroker.publishEvent({
      type: EVENT_TYPES.BED_ALLOCATED,
      data: {
        bedId,
        bookingId: request._id,
        studentId: request.studentId,
        hostelId,
        roomId
      },
      correlationId: uuidv4(),
      timestamp: new Date()
    });

    return request;
  }

  public async cancelRequest(requestId: string, cancelledBy: string, reason?: string): Promise<AllocationRequestDocument> {
    const request = await this.getAllocationRequestById(requestId);
    
    if (request.status === 'CANCELLED') {
      throw new ValidationError('Request is already cancelled');
    }

    request.cancel(cancelledBy, reason);
    await request.save();

    allocationLogger.logger.info('Allocation request cancelled', { 
      requestId: request._id, 
      cancelledBy,
      reason 
    });

    return request;
  }

  // Document Management
  public async addDocument(requestId: string, type: string, url: string): Promise<AllocationRequestDocument> {
    const request = await this.getAllocationRequestById(requestId);
    request.addDocument(type, url);
    await request.save();
    return request;
  }

  public async verifyDocument(requestId: string, documentIndex: number, verifiedBy: string): Promise<AllocationRequestDocument> {
    const request = await this.getAllocationRequestById(requestId);
    request.verifyDocument(documentIndex, verifiedBy);
    await request.save();
    return request;
  }

  // Allocation Algorithm
  public async processAllocation(ruleId: string): Promise<{ allocated: number; waitlisted: number; errors: number }> {
    const rule = await this.getAllocationRuleById(ruleId);
    
    if (!rule.isAllocationPeriod()) {
      throw new ValidationError('Allocation period is not active for this rule');
    }

    const approvedRequests = await AllocationRequest.find({
      allocationRuleId: ruleId,
      status: 'APPROVED'
    }).sort({ priority: -1, createdAt: 1 });

    let allocated = 0;
    let waitlisted = 0;
    let errors = 0;

    for (const request of approvedRequests) {
      try {
        if (allocated < rule.getAvailableSeats()) {
          // Try to allocate
          // This would integrate with the hostel service to find available beds
          // For now, we'll just mark as allocated
          request.status = 'ALLOCATED';
          await request.save();
          allocated++;
        } else if (waitlisted < rule.quotas.waitlistCapacity) {
          // Add to waitlist
          await this.waitlistRequest(request._id.toString());
          waitlisted++;
        } else {
          // Reject due to capacity
          await this.rejectRequest(request._id.toString(), 'SYSTEM', 'No capacity available');
          errors++;
        }
      } catch (error) {
        allocationLogger.logger.error('Error processing allocation request', { 
          requestId: request._id, 
          error 
        });
        errors++;
      }
    }

    allocationLogger.logger.info('Allocation processing completed', { 
      ruleId, 
      allocated, 
      waitlisted, 
      errors 
    });

    return { allocated, waitlisted, errors };
  }

  // Statistics
  public async getAllocationStatistics(): Promise<any> {
    const [totalRequests, pendingRequests, approvedRequests, allocatedRequests, waitlistedRequests, rejectedRequests] = await Promise.all([
      AllocationRequest.countDocuments(),
      AllocationRequest.countDocuments({ status: 'PENDING' }),
      AllocationRequest.countDocuments({ status: 'APPROVED' }),
      AllocationRequest.countDocuments({ status: 'ALLOCATED' }),
      AllocationRequest.countDocuments({ status: 'WAITLISTED' }),
      AllocationRequest.countDocuments({ status: 'REJECTED' })
    ]);

    return {
      totalRequests,
      pendingRequests,
      approvedRequests,
      allocatedRequests,
      waitlistedRequests,
      rejectedRequests,
      approvalRate: totalRequests > 0 ? (approvedRequests / totalRequests) * 100 : 0,
      allocationRate: totalRequests > 0 ? (allocatedRequests / totalRequests) * 100 : 0
    };
  }
}

export const allocationService = new AllocationService();
