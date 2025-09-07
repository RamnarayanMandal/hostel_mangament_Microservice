import { Payment, PaymentDocument } from '../models/Payment';
import { CreatePaymentInput, UpdatePaymentInput } from '../../../shared/utils/validation';
import { ConflictError, NotFoundError, ValidationError } from '../../../shared/utils/errors';
import { getMessageBroker, EVENT_TYPES } from '../../../shared/config/message-broker';
import { paymentLogger } from '../../../shared/utils/logger';
import { v4 as uuidv4 } from 'uuid';
import Stripe from 'stripe';
import Razorpay from 'razorpay';
import crypto from 'crypto';

export class PaymentService {
  private messageBroker = getMessageBroker();
  private stripe: Stripe;
  private razorpay: Razorpay | null;

  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
      apiVersion: '2023-10-16'
    });
    
    // Initialize Razorpay only if credentials are provided
    if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
      this.razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET
      });
    } else {
      console.log('⚠️ Razorpay credentials not provided, Razorpay payments will be disabled');
      this.razorpay = null;
    }
  }

  public async createPayment(paymentData: CreatePaymentInput, createdBy: string): Promise<PaymentDocument> {
    try {
      // Calculate net amount
      const netAmount = this.calculateNetAmount(paymentData);

      const payment = new Payment({
        ...paymentData,
        createdBy,
        netAmount,
        dueDate: paymentData.dueDate ? new Date(paymentData.dueDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      });

      const savedPayment = await payment.save();

      // Publish payment created event
      await this.messageBroker.publishEvent({
        id: uuidv4(),
        type: EVENT_TYPES.PAYMENT_CREATED,
        service: 'payment-service',
        data: {
          paymentId: savedPayment._id,
          bookingId: savedPayment.bookingId,
          studentId: savedPayment.studentId,
          amount: savedPayment.amount
        },
        timestamp: new Date(),
        correlationId: uuidv4()
      });

      paymentLogger.logger.info('Payment created', { paymentId: savedPayment._id, bookingId: savedPayment.bookingId });
      return savedPayment;
    } catch (error) {
      paymentLogger.logger.error('Failed to create payment', { error, paymentData });
      throw error;
    }
  }

  public async getPaymentById(paymentId: string): Promise<PaymentDocument> {
    const payment = await Payment.findById(paymentId)
      .populate('bookingId', 'bookingId checkInDate checkOutDate totalAmount')
      .populate('studentId', 'fullName enrollmentNo email');

    if (!payment) {
      throw new NotFoundError('Payment not found');
    }

    return payment;
  }

  public async updatePayment(paymentId: string, updateData: UpdatePaymentInput, updatedBy: string): Promise<PaymentDocument> {
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      throw new NotFoundError('Payment not found');
    }

    // Check if payment can be updated
    if (payment.status === 'SUCCESS' || payment.status === 'REFUNDED') {
      throw new ValidationError('Cannot update completed or refunded payment');
    }

    Object.assign(payment, updateData, { updatedBy });

    if (updateData.amount) {
      payment.netAmount = this.calculateNetAmount({ ...payment.toObject(), ...updateData });
    }

    const updatedPayment = await payment.save();
    paymentLogger.logger.info('Payment updated', { paymentId: updatedPayment._id, status: updatedPayment.status });
    return updatedPayment;
  }

  public async getPayments(page: number = 1, limit: number = 10, filters: any = {}): Promise<{
    payments: PaymentDocument[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const query: any = {};

    // Apply filters
    if (filters.bookingId) query.bookingId = filters.bookingId;
    if (filters.studentId) query.studentId = filters.studentId;
    if (filters.status) query.status = filters.status;
    if (filters.paymentMethod) query.paymentMethod = filters.paymentMethod;
    if (filters.paymentGateway) query.paymentGateway = filters.paymentGateway;
    if (filters.paymentDate) {
      query.paymentDate = { $gte: new Date(filters.paymentDate) };
    }

    const skip = (page - 1) * limit;
    const [payments, total] = await Promise.all([
      Payment.find(query)
        .populate('bookingId', 'bookingId checkInDate checkOutDate')
        .populate('studentId', 'fullName enrollmentNo')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Payment.countDocuments(query)
    ]);

    return {
      payments,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  public async getPaymentsByBooking(bookingId: string): Promise<PaymentDocument[]> {
    return Payment.findByBookingId(bookingId)
      .populate('studentId', 'fullName enrollmentNo');
  }

  public async getPaymentsByStudent(studentId: string): Promise<PaymentDocument[]> {
    return Payment.findByStudentId(studentId)
      .populate('bookingId', 'bookingId checkInDate checkOutDate');
  }

  public async processPayment(paymentId: string, paymentMethodData: any): Promise<PaymentDocument> {
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      throw new NotFoundError('Payment not found');
    }

    if (!payment.isPending()) {
      throw new ValidationError('Payment is not in pending state');
    }

    try {
      await payment.markAsProcessing();

      let gatewayResponse;
      switch (payment.paymentGateway) {
        case 'STRIPE':
          gatewayResponse = await this.processStripePayment(payment, paymentMethodData);
          break;
        case 'RAZORPAY':
          gatewayResponse = await this.processRazorpayPayment(payment, paymentMethodData);
          break;
        case 'CASH':
        case 'CHEQUE':
        case 'BANK_TRANSFER':
          gatewayResponse = await this.processOfflinePayment(payment, paymentMethodData);
          break;
        default:
          throw new ValidationError('Unsupported payment gateway');
      }

      await payment.markAsSuccess(gatewayResponse);

      // Publish payment succeeded event
      await this.messageBroker.publishEvent({
        id: uuidv4(),
        type: EVENT_TYPES.PAYMENT_SUCCEEDED,
        service: 'payment-service',
        data: {
          paymentId: payment._id,
          bookingId: payment.bookingId,
          studentId: payment.studentId,
          amount: payment.amount,
          transactionId: payment.transactionId
        },
        timestamp: new Date(),
        correlationId: uuidv4()
      });

      paymentLogger.logger.info('Payment processed successfully', { paymentId: payment._id, transactionId: payment.transactionId });
      return payment;
    } catch (error) {
      await payment.markAsFailed({ error: error.message, response: error });
      
      // Publish payment failed event
      await this.messageBroker.publishEvent({
        id: uuidv4(),
        type: EVENT_TYPES.PAYMENT_FAILED,
        service: 'payment-service',
        data: {
          paymentId: payment._id,
          bookingId: payment.bookingId,
          studentId: payment.studentId,
          amount: payment.amount,
          error: (error as Error).message
        },
        timestamp: new Date(),
        correlationId: uuidv4()
      });

      paymentLogger.logger.error('Payment processing failed', { paymentId: payment._id, error: error.message });
      throw error;
    }
  }

  public async retryPayment(paymentId: string): Promise<PaymentDocument> {
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      throw new NotFoundError('Payment not found');
    }

    if (!payment.canRetry()) {
      throw new ValidationError('Payment cannot be retried');
    }

    // Reset payment to pending state for retry
    payment.status = 'PENDING';
    payment.nextRetryAt = undefined;
    await payment.save();

    paymentLogger.logger.info('Payment retry initiated', { paymentId: payment._id, retryAttempts: payment.retryAttempts });
    return payment;
  }

  public async processRefund(paymentId: string, refundData: any): Promise<PaymentDocument> {
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      throw new NotFoundError('Payment not found');
    }

    if (!payment.canRefund()) {
      throw new ValidationError('Payment cannot be refunded');
    }

    if (refundData.amount > payment.calculateRefundableAmount()) {
      throw new ValidationError('Refund amount exceeds refundable amount');
    }

    try {
      let gatewayResponse;
      switch (payment.paymentGateway) {
        case 'STRIPE':
          gatewayResponse = await this.processStripeRefund(payment, refundData);
          break;
        case 'RAZORPAY':
          gatewayResponse = await this.processRazorpayRefund(payment, refundData);
          break;
        case 'CASH':
        case 'CHEQUE':
        case 'BANK_TRANSFER':
          gatewayResponse = await this.processOfflineRefund(payment, refundData);
          break;
        default:
          throw new ValidationError('Unsupported payment gateway for refund');
      }

      await payment.processRefund({
        ...refundData,
        refundId: gatewayResponse.refundId
      });

      // Publish refund processed event
      await this.messageBroker.publishEvent({
        id: uuidv4(),
        type: EVENT_TYPES.REFUND_PROCESSED,
        service: 'payment-service',
        data: {
          paymentId: payment._id,
          bookingId: payment.bookingId,
          studentId: payment.studentId,
          refundAmount: refundData.amount,
          refundId: gatewayResponse.refundId
        },
        timestamp: new Date(),
        correlationId: uuidv4()
      });

      paymentLogger.logger.info('Refund processed successfully', { paymentId: payment._id, refundAmount: refundData.amount });
      return payment;
    } catch (error) {
      paymentLogger.logger.error('Refund processing failed', { paymentId: payment._id, error: error.message });
      throw error;
    }
  }

  public async generatePaymentIntent(paymentId: string): Promise<any> {
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      throw new NotFoundError('Payment not found');
    }

    try {
      switch (payment.paymentGateway) {
        case 'STRIPE':
          return await this.generateStripePaymentIntent(payment);
        case 'RAZORPAY':
          return await this.generateRazorpayOrder(payment);
        default:
          throw new ValidationError('Unsupported payment gateway');
      }
    } catch (error) {
      paymentLogger.logger.error('Failed to generate payment intent', { paymentId: payment._id, error: error.message });
      throw error;
    }
  }

  public async handleWebhook(gateway: string, webhookData: any, signature: string): Promise<void> {
    try {
      // Verify webhook signature
      if (!this.verifyWebhookSignature(gateway, webhookData, signature)) {
        throw new ValidationError('Invalid webhook signature');
      }

      const payment = await Payment.findOne({ 
        gatewayTransactionId: webhookData.id || webhookData.razorpay_payment_id 
      });

      if (!payment) {
        paymentLogger.logger.warn('Payment not found for webhook', { gateway, webhookId: webhookData.id });
        return;
      }

      await payment.addWebhookEvent({
        type: webhookData.type || webhookData.event,
        data: webhookData
      });

      // Process webhook based on event type
      switch (webhookData.type || webhookData.event) {
        case 'payment_intent.succeeded':
        case 'payment.captured':
          if (payment.status !== 'SUCCESS') {
            await payment.markAsSuccess({
              transactionId: payment.transactionId,
              gatewayTransactionId: webhookData.id,
              gatewayResponse: webhookData
            });
          }
          break;
        case 'payment_intent.payment_failed':
        case 'payment.failed':
          if (payment.status !== 'FAILED') {
            await payment.markAsFailed({
              error: webhookData.data?.last_payment_error?.message || 'Payment failed',
              response: webhookData
            });
          }
          break;
        default:
          paymentLogger.logger.info('Unhandled webhook event', { type: webhookData.type, paymentId: payment._id });
      }
    } catch (error) {
      paymentLogger.logger.error('Webhook processing failed', { gateway, error: error.message });
      throw error;
    }
  }

  public async getPaymentStatistics(): Promise<any> {
    const stats = await Payment.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);

    const totalPayments = await Payment.countDocuments();
    const successfulPayments = await Payment.countDocuments({ status: 'SUCCESS' });
    const pendingPayments = await Payment.countDocuments({ status: { $in: ['PENDING', 'PROCESSING'] } });
    const totalAmount = await Payment.aggregate([
      { $match: { status: 'SUCCESS' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    return {
      byStatus: stats,
      totalPayments,
      successfulPayments,
      pendingPayments,
      totalAmount: totalAmount[0]?.total || 0
    };
  }

  public async getFailedPayments(): Promise<PaymentDocument[]> {
    return Payment.findFailedPayments()
      .populate('bookingId', 'bookingId')
      .populate('studentId', 'fullName enrollmentNo');
  }

  public async getPendingPayments(): Promise<PaymentDocument[]> {
    return Payment.findPendingPayments()
      .populate('bookingId', 'bookingId')
      .populate('studentId', 'fullName enrollmentNo');
  }

  // Private methods for payment gateway integration
  private async processStripePayment(payment: PaymentDocument, paymentMethodData: any): Promise<any> {
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: Math.round(payment.netAmount * 100), // Convert to cents
      currency: payment.currency.toLowerCase(),
      payment_method: paymentMethodData.paymentMethodId,
      confirm: true,
      return_url: `${process.env.FRONTEND_URL}/payment/confirm`,
      metadata: {
        paymentId: payment.paymentId,
        bookingId: payment.bookingId.toString(),
        studentId: payment.studentId.toString()
      }
    });

    return {
      transactionId: paymentIntent.id,
      gatewayTransactionId: paymentIntent.id,
      gatewayResponse: paymentIntent
    };
  }

  private async processRazorpayPayment(payment: PaymentDocument, paymentMethodData: any): Promise<any> {
    const order = await this.razorpay.orders.create({
      amount: Math.round(payment.netAmount * 100), // Convert to paise
      currency: payment.currency,
      receipt: payment.paymentId,
      notes: {
        paymentId: payment.paymentId,
        bookingId: payment.bookingId.toString(),
        studentId: payment.studentId.toString()
      }
    });

    return {
      transactionId: order.id,
      gatewayTransactionId: order.id,
      gatewayResponse: order
    };
  }

  private async processOfflinePayment(payment: PaymentDocument, paymentMethodData: any): Promise<any> {
    // For offline payments, we just mark them as successful
    return {
      transactionId: `OFFLINE_${Date.now()}`,
      gatewayTransactionId: `OFFLINE_${Date.now()}`,
      gatewayResponse: { method: payment.paymentMethod, reference: paymentMethodData.reference }
    };
  }

  private async processStripeRefund(payment: PaymentDocument, refundData: any): Promise<any> {
    const refund = await this.stripe.refunds.create({
      payment_intent: payment.gatewayTransactionId!,
      amount: Math.round(refundData.amount * 100),
      reason: refundData.reason || 'requested_by_customer'
    });

    return {
      refundId: refund.id,
      gatewayResponse: refund
    };
  }

  private async processRazorpayRefund(payment: PaymentDocument, refundData: any): Promise<any> {
    const refund = await this.razorpay.payments.refund(payment.gatewayTransactionId!, {
      amount: Math.round(refundData.amount * 100),
      notes: {
        reason: refundData.reason
      }
    });

    return {
      refundId: refund.id,
      gatewayResponse: refund
    };
  }

  private async processOfflineRefund(payment: PaymentDocument, refundData: any): Promise<any> {
    return {
      refundId: `OFFLINE_REFUND_${Date.now()}`,
      gatewayResponse: { method: 'offline', reference: refundData.reference }
    };
  }

  private async generateStripePaymentIntent(payment: PaymentDocument): Promise<any> {
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: Math.round(payment.netAmount * 100),
      currency: payment.currency.toLowerCase(),
      metadata: {
        paymentId: payment.paymentId,
        bookingId: payment.bookingId.toString(),
        studentId: payment.studentId.toString()
      }
    });

    payment.paymentIntentId = paymentIntent.id;
    await payment.save();

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    };
  }

  private async generateRazorpayOrder(payment: PaymentDocument): Promise<any> {
    const order = await this.razorpay.orders.create({
      amount: Math.round(payment.netAmount * 100),
      currency: payment.currency,
      receipt: payment.paymentId,
      notes: {
        paymentId: payment.paymentId,
        bookingId: payment.bookingId.toString(),
        studentId: payment.studentId.toString()
      }
    });

    payment.paymentIntentId = order.id;
    await payment.save();

    return {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency
    };
  }

  private verifyWebhookSignature(gateway: string, webhookData: any, signature: string): boolean {
    try {
      switch (gateway) {
        case 'stripe':
          return this.stripe.webhooks.constructEvent(
            JSON.stringify(webhookData),
            signature,
            process.env.STRIPE_WEBHOOK_SECRET || ''
          ) !== null;
        case 'razorpay':
          const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET || '')
            .update(JSON.stringify(webhookData))
            .digest('hex');
          return crypto.timingSafeEqual(
            Buffer.from(signature),
            Buffer.from(expectedSignature)
          );
        default:
          return false;
      }
    } catch (error) {
      paymentLogger.logger.error('Webhook signature verification failed', { gateway, error: error.message });
      return false;
    }
  }

  private calculateNetAmount(paymentData: any): number {
    const baseAmount = paymentData.amount || 0;
    const discount = paymentData.discount || 0;
    const taxAmount = paymentData.taxAmount || 0;
    const processingFees = paymentData.processingFees || 0;
    const lateFees = paymentData.lateFees || 0;

    return Math.max(0, baseAmount - discount + taxAmount + processingFees + lateFees);
  }
}

export const paymentService = new PaymentService();
