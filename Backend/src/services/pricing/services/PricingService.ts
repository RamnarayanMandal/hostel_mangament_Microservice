import { FeePolicy, FeePolicyDocument } from '../models/FeePolicy';
import { CreateFeePolicyInput, UpdateFeePolicyInput } from '../../../shared/utils/validation';
import { ConflictError, NotFoundError, ValidationError } from '../../../shared/utils/errors';
import { getMessageBroker, EVENT_TYPES } from '../../../shared/config/message-broker';
import { pricingLogger } from '../../../shared/utils/logger';
import { v4 as uuidv4 } from 'uuid';

export class PricingService {
  private messageBroker = getMessageBroker();

  // Fee Policy Management
  public async createFeePolicy(policyData: CreateFeePolicyInput, createdBy: string): Promise<FeePolicyDocument> {
    try {
      const policy = new FeePolicy({
        ...policyData,
        createdBy,
        effectiveFrom: new Date(policyData.effectiveFrom),
        effectiveTo: policyData.effectiveTo ? new Date(policyData.effectiveTo) : undefined
      });

      await policy.save();
      
      pricingLogger.logger.info('Fee policy created', { 
        policyId: policy._id, 
        hostelId: policy.hostelId,
        roomType: policy.roomType,
        createdBy 
      });

      // Publish event
      await this.messageBroker.publishEvent({
        type: EVENT_TYPES.PRICING_POLICY_UPDATED,
        data: {
          policyId: policy._id,
          hostelId: policy.hostelId,
          roomType: policy.roomType,
          action: 'CREATED'
        },
        correlationId: uuidv4(),
        timestamp: new Date()
      });

      return policy;
    } catch (error: any) {
      if (error.code === 11000) {
        throw new ConflictError('Fee policy already exists for this hostel and room type');
      }
      throw error;
    }
  }

  public async getFeePolicyById(policyId: string): Promise<FeePolicyDocument> {
    const policy = await FeePolicy.findById(policyId);
    if (!policy) {
      throw new NotFoundError('Fee policy not found');
    }
    return policy;
  }

  public async updateFeePolicy(policyId: string, updateData: UpdateFeePolicyInput, updatedBy: string): Promise<FeePolicyDocument> {
    const policy = await this.getFeePolicyById(policyId);
    
    // Convert date strings to Date objects if provided
    if (updateData.effectiveFrom) {
      updateData.effectiveFrom = new Date(updateData.effectiveFrom);
    }
    if (updateData.effectiveTo) {
      updateData.effectiveTo = new Date(updateData.effectiveTo);
    }

    Object.assign(policy, updateData, { updatedBy });
    await policy.save();

    pricingLogger.logger.info('Fee policy updated', { 
      policyId: policy._id, 
      updatedBy 
    });

    // Publish event
    await this.messageBroker.publishEvent({
      type: EVENT_TYPES.PRICING_POLICY_UPDATED,
      data: {
        policyId: policy._id,
        hostelId: policy.hostelId,
        roomType: policy.roomType,
        action: 'UPDATED'
      },
      correlationId: uuidv4(),
      timestamp: new Date()
    });

    return policy;
  }

  public async getFeePolicies(page: number = 1, limit: number = 10, filters: any = {}): Promise<{ policies: FeePolicyDocument[]; total: number; page: number; limit: number; totalPages: number }> {
    const query: any = {};
    
    if (filters.hostelId) {
      query.hostelId = filters.hostelId;
    }
    if (filters.roomType) {
      query.roomType = filters.roomType;
    }
    if (filters.isActive !== undefined) {
      query.isActive = filters.isActive;
    }

    const skip = (page - 1) * limit;
    const [policies, total] = await Promise.all([
      FeePolicy.find(query).sort({ effectiveFrom: -1 }).skip(skip).limit(limit),
      FeePolicy.countDocuments(query)
    ]);

    return {
      policies,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  public async getActiveFeePolicies(): Promise<FeePolicyDocument[]> {
    return FeePolicy.findActivePolicies();
  }

  public async getPoliciesForHostel(hostelId: string): Promise<FeePolicyDocument[]> {
    return FeePolicy.findPoliciesForHostel(hostelId);
  }

  public async getPoliciesForRoomType(hostelId: string, roomType: string): Promise<FeePolicyDocument[]> {
    return FeePolicy.findPoliciesForRoomType(hostelId, roomType);
  }

  // Fee Calculation
  public async calculateFee(hostelId: string, roomType: string, studentData: any, duration: number = 1): Promise<{
    policyId: string;
    baseAmount: number;
    adjustments: Array<{ type: string; name: string; amount: number; description: string }>;
    totalAmount: number;
    breakdown: any;
    currency: string;
  }> {
    const policies = await FeePolicy.findPoliciesForRoomType(hostelId, roomType);
    
    if (policies.length === 0) {
      throw new NotFoundError(`No fee policy found for hostel ${hostelId} and room type ${roomType}`);
    }

    // Get the most recent active policy
    const activePolicy = policies[0];
    
    if (!activePolicy.isCurrentlyActive()) {
      throw new ValidationError('No active fee policy found for the specified criteria');
    }

    const calculation = activePolicy.calculateFee(studentData, duration);

    pricingLogger.logger.info('Fee calculated', { 
      policyId: activePolicy._id,
      hostelId,
      roomType,
      baseAmount: calculation.baseAmount,
      totalAmount: calculation.totalAmount,
      adjustmentsCount: calculation.adjustments.length
    });

    return {
      policyId: activePolicy._id.toString(),
      ...calculation,
      currency: activePolicy.currency
    };
  }

  public async calculateFeeForMultipleRooms(hostelId: string, roomTypes: string[], studentData: any, duration: number = 1): Promise<{
    [roomType: string]: {
      policyId: string;
      baseAmount: number;
      adjustments: Array<{ type: string; name: string; amount: number; description: string }>;
      totalAmount: number;
      breakdown: any;
      currency: string;
    };
  }> {
    const results: any = {};

    for (const roomType of roomTypes) {
      try {
        results[roomType] = await this.calculateFee(hostelId, roomType, studentData, duration);
      } catch (error) {
        pricingLogger.logger.warn('Failed to calculate fee for room type', { 
          hostelId, 
          roomType, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
        results[roomType] = { error: 'Fee calculation failed' };
      }
    }

    return results;
  }

  // Late Fee Calculation
  public async calculateLateFee(policyId: string, amount: number, dueDate: Date, paymentDate: Date): Promise<{
    daysLate: number;
    lateFeeAmount: number;
    gracePeriod: number;
    lateFeePercentage: number;
  }> {
    const policy = await this.getFeePolicyById(policyId);
    
    const daysLate = Math.ceil((paymentDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
    const lateFeeAmount = policy.calculateLateFee(amount, daysLate);

    return {
      daysLate: Math.max(0, daysLate),
      lateFeeAmount,
      gracePeriod: policy.paymentTerms.gracePeriod,
      lateFeePercentage: policy.paymentTerms.lateFeePercentage
    };
  }

  // Refund Calculation
  public async calculateRefund(policyId: string, amount: number): Promise<{
    refundAmount: number;
    refundPercentage: number;
    processingDays: number;
  }> {
    const policy = await this.getFeePolicyById(policyId);
    
    const refundAmount = policy.calculateRefund(amount);

    return {
      refundAmount,
      refundPercentage: policy.refundPolicy.refundPercentage,
      processingDays: policy.refundPolicy.processingDays
    };
  }

  // Adjustment Management
  public async addAdjustment(policyId: string, adjustment: any, addedBy: string): Promise<FeePolicyDocument> {
    const policy = await this.getFeePolicyById(policyId);
    
    policy.adjustments.push({
      ...adjustment,
      validFrom: new Date(),
      isActive: true
    });

    await policy.save();

    pricingLogger.logger.info('Adjustment added to fee policy', { 
      policyId: policy._id, 
      adjustmentType: adjustment.type,
      addedBy 
    });

    return policy;
  }

  public async updateAdjustment(policyId: string, adjustmentIndex: number, updateData: any, updatedBy: string): Promise<FeePolicyDocument> {
    const policy = await this.getFeePolicyById(policyId);
    
    if (adjustmentIndex < 0 || adjustmentIndex >= policy.adjustments.length) {
      throw new ValidationError('Invalid adjustment index');
    }

    Object.assign(policy.adjustments[adjustmentIndex], updateData);
    await policy.save();

    pricingLogger.logger.info('Adjustment updated', { 
      policyId: policy._id, 
      adjustmentIndex,
      updatedBy 
    });

    return policy;
  }

  public async removeAdjustment(policyId: string, adjustmentIndex: number, removedBy: string): Promise<FeePolicyDocument> {
    const policy = await this.getFeePolicyById(policyId);
    
    if (adjustmentIndex < 0 || adjustmentIndex >= policy.adjustments.length) {
      throw new ValidationError('Invalid adjustment index');
    }

    policy.adjustments.splice(adjustmentIndex, 1);
    await policy.save();

    pricingLogger.logger.info('Adjustment removed', { 
      policyId: policy._id, 
      adjustmentIndex,
      removedBy 
    });

    return policy;
  }

  // Bulk Operations
  public async bulkUpdatePolicies(updates: Array<{ policyId: string; updateData: UpdateFeePolicyInput }>, updatedBy: string): Promise<FeePolicyDocument[]> {
    const updatedPolicies: FeePolicyDocument[] = [];

    for (const update of updates) {
      try {
        const policy = await this.updateFeePolicy(update.policyId, update.updateData, updatedBy);
        updatedPolicies.push(policy);
      } catch (error) {
        pricingLogger.logger.error('Failed to update policy in bulk operation', { 
          policyId: update.policyId, 
          error 
        });
        throw error;
      }
    }

    return updatedPolicies;
  }

  // Statistics and Analytics
  public async getPricingStatistics(): Promise<any> {
    const [totalPolicies, activePolicies, policiesByRoomType, policiesByHostel] = await Promise.all([
      FeePolicy.countDocuments(),
      FeePolicy.countDocuments({ isActive: true }),
      FeePolicy.aggregate([
        { $group: { _id: '$roomType', count: { $sum: 1 } } }
      ]),
      FeePolicy.aggregate([
        { $group: { _id: '$hostelId', count: { $sum: 1 } } }
      ])
    ]);

    return {
      totalPolicies,
      activePolicies,
      inactivePolicies: totalPolicies - activePolicies,
      policiesByRoomType,
      policiesByHostel,
      activePercentage: totalPolicies > 0 ? (activePolicies / totalPolicies) * 100 : 0
    };
  }

  public async getFeeComparison(hostelId: string, roomTypes: string[], studentData: any, duration: number = 1): Promise<any> {
    const comparison: any = {};

    for (const roomType of roomTypes) {
      try {
        const feeCalculation = await this.calculateFee(hostelId, roomType, studentData, duration);
        comparison[roomType] = {
          totalAmount: feeCalculation.totalAmount,
          baseAmount: feeCalculation.baseAmount,
          adjustmentsCount: feeCalculation.adjustments.length,
          currency: feeCalculation.currency
        };
      } catch (error) {
        comparison[roomType] = { error: 'Calculation failed' };
      }
    }

    return comparison;
  }

  // Policy Validation
  public async validatePolicy(policyData: CreateFeePolicyInput): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Check for overlapping effective dates
    const existingPolicies = await FeePolicy.find({
      hostelId: policyData.hostelId,
      roomType: policyData.roomType,
      isActive: true
    });

    const newEffectiveFrom = new Date(policyData.effectiveFrom);
    const newEffectiveTo = policyData.effectiveTo ? new Date(policyData.effectiveTo) : null;

    for (const existingPolicy of existingPolicies) {
      if (existingPolicy.isCurrentlyActive()) {
        const existingFrom = existingPolicy.effectiveFrom;
        const existingTo = existingPolicy.effectiveTo;

        // Check for overlap
        if ((!newEffectiveTo || newEffectiveTo > existingFrom) && 
            (!existingTo || existingTo > newEffectiveFrom)) {
          errors.push(`Policy overlaps with existing policy: ${existingPolicy.name}`);
        }
      }
    }

    // Validate adjustments
    if (policyData.adjustments) {
      for (let i = 0; i < policyData.adjustments.length; i++) {
        const adjustment = policyData.adjustments[i];
        
        if (adjustment.value.amount < 0) {
          errors.push(`Adjustment ${i + 1}: Amount cannot be negative`);
        }

        if (adjustment.value.kind === 'PERCENT' && adjustment.value.amount > 100) {
          errors.push(`Adjustment ${i + 1}: Percentage cannot exceed 100%`);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

export const pricingService = new PricingService();





