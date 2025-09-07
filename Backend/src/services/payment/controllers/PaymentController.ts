import { Request, Response } from 'express';
import { paymentService } from '../services/PaymentService';
import { validateRequest, createPaymentSchema, updatePaymentSchema, paginationSchema, idParamSchema } from '../../../shared/utils/validation';
import { authenticate, requireAdmin, requireStaff } from '../../../shared/middleware/auth';
import { asyncHandler, successResponse, errorResponse } from '../../../shared/utils/errors';
import { paymentLogger } from '../../../shared/utils/logger';

export class PaymentController {
  public createPayment = asyncHandler(async (req: Request, res: Response) => {
    const payment = await paymentService.createPayment(req.validatedData, req.user!.id);
    res.status(201).json(successResponse('Payment created successfully', payment));
  });

  public getPaymentById = asyncHandler(async (req: Request, res: Response) => {
    const payment = await paymentService.getPaymentById(req.validatedData.id);
    res.json(successResponse('Payment retrieved successfully', payment));
  });

  public updatePayment = asyncHandler(async (req: Request, res: Response) => {
    const payment = await paymentService.updatePayment(req.validatedData.id, req.validatedData, req.user!.id);
    res.json(successResponse('Payment updated successfully', payment));
  });

  public getPayments = asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, ...filters } = req.validatedData;
    const result = await paymentService.getPayments(page, limit, filters);
    res.json(successResponse('Payments retrieved successfully', result));
  });

  public getPaymentsByBooking = asyncHandler(async (req: Request, res: Response) => {
    const payments = await paymentService.getPaymentsByBooking(req.params.bookingId);
    res.json(successResponse('Booking payments retrieved successfully', payments));
  });

  public getPaymentsByStudent = asyncHandler(async (req: Request, res: Response) => {
    const payments = await paymentService.getPaymentsByStudent(req.params.studentId);
    res.json(successResponse('Student payments retrieved successfully', payments));
  });

  public processPayment = asyncHandler(async (req: Request, res: Response) => {
    const { paymentMethodId, paymentMethodData } = req.body;
    const payment = await paymentService.processPayment(req.params.id, {
      paymentMethodId,
      ...paymentMethodData
    });
    res.json(successResponse('Payment processed successfully', payment));
  });

  public retryPayment = asyncHandler(async (req: Request, res: Response) => {
    const payment = await paymentService.retryPayment(req.params.id);
    res.json(successResponse('Payment retry initiated successfully', payment));
  });

  public processRefund = asyncHandler(async (req: Request, res: Response) => {
    const { amount, reason, reference } = req.body;
    const payment = await paymentService.processRefund(req.params.id, {
      amount,
      reason,
      reference
    });
    res.json(successResponse('Refund processed successfully', payment));
  });

  public generatePaymentIntent = asyncHandler(async (req: Request, res: Response) => {
    const paymentIntent = await paymentService.generatePaymentIntent(req.params.id);
    res.json(successResponse('Payment intent generated successfully', paymentIntent));
  });

  public handleStripeWebhook = asyncHandler(async (req: Request, res: Response) => {
    const signature = req.headers['stripe-signature'] as string;
    await paymentService.handleWebhook('stripe', req.body, signature);
    res.json({ received: true });
  });

  public handleRazorpayWebhook = asyncHandler(async (req: Request, res: Response) => {
    const signature = req.headers['x-razorpay-signature'] as string;
    await paymentService.handleWebhook('razorpay', req.body, signature);
    res.json({ received: true });
  });

  public getPaymentStatistics = asyncHandler(async (req: Request, res: Response) => {
    const stats = await paymentService.getPaymentStatistics();
    res.json(successResponse('Payment statistics retrieved successfully', stats));
  });

  public getFailedPayments = asyncHandler(async (req: Request, res: Response) => {
    const payments = await paymentService.getFailedPayments();
    res.json(successResponse('Failed payments retrieved successfully', payments));
  });

  public getPendingPayments = asyncHandler(async (req: Request, res: Response) => {
    const payments = await paymentService.getPendingPayments();
    res.json(successResponse('Pending payments retrieved successfully', payments));
  });

  public generateReceipt = asyncHandler(async (req: Request, res: Response) => {
    // This would typically generate a PDF receipt
    // For now, we'll just return a success message
    res.json(successResponse('Receipt generation initiated successfully', {
      receiptUrl: `/receipts/${req.params.id}.pdf`
    }));
  });

  public health = asyncHandler(async (req: Request, res: Response) => {
    res.json(successResponse('Payment service is healthy', {
      service: 'payment',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    }));
  });
}

export const paymentController = new PaymentController();
