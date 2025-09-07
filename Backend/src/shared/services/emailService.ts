import nodemailer from 'nodemailer';
import { authLogger } from '../utils/logger';
import { config } from '../config/env';
import { emailTemplateService } from './emailTemplateService';

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    // Check if SMTP credentials are available
    if (!config.notification.email.auth.user || !config.notification.email.auth.pass) {
      authLogger.logger.warn('SMTP credentials not configured. Email service will not work properly.', {
        hasUser: !!config.notification.email.auth.user,
        hasPass: !!config.notification.email.auth.pass
      });
    }

    this.transporter = nodemailer.createTransport({
      host: config.notification.email.host || 'smtp.gmail.com',
      port: config.notification.email.port || 587,
      secure: config.notification.email.secure || false, // true for 465, false for other ports
      auth: {
        user: config.notification.email.auth.user,
        pass: config.notification.email.auth.pass,
      },
    });
  }

  /**
   * Send email
   */
  public async sendEmail(to: string, subject: string, html: string): Promise<void> {
    try {
      // Check if credentials are available before attempting to send
      if (!config.notification.email.auth.user || !config.notification.email.auth.pass) {
        throw new Error('SMTP credentials not configured. Please set SMTP_USER and SMTP_PASS environment variables.');
      }

      const mailOptions = {
        from: process.env.SMTP_FROM || config.notification.email.auth.user,
        to,
        subject,
        html,
      };

      const info = await this.transporter.sendMail(mailOptions);
      
      authLogger.logger.info('Email sent successfully', {
        messageId: info.messageId,
        to,
        subject,
      });
    } catch (error: any) {
      authLogger.logger.error('Failed to send email', {
        error: error.message,
        to,
        subject,
        hasCredentials: !!(config.notification.email.auth.user && config.notification.email.auth.pass)
      });
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  /**
   * Send OTP email
   */
  public async sendOTPEmail(to: string, otp: string): Promise<void> {
    const subject = '🔐 Email Verification OTP - Hostel Management';
    const html = await emailTemplateService.getOTPVerificationTemplate(otp);
    await this.sendEmail(to, subject, html);
  }

  /**
   * Send password reset email
   */
  public async sendPasswordResetEmail(to: string, resetToken: string): Promise<void> {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/reset-password?token=${resetToken}`;
    const subject = '🔑 Password Reset Request - Hostel Management';
    const html = await emailTemplateService.getPasswordResetTemplate(resetUrl);
    await this.sendEmail(to, subject, html);
  }

  /**
   * Send booking confirmation email
   */
  public async sendBookingConfirmationEmail(to: string, bookingData: {
    bookingId: string;
    hostelName: string;
    roomType: string;
    checkinDate: string;
    checkoutDate: string;
    totalAmount: number;
  }): Promise<void> {
    const subject = '🏠 Booking Confirmed - Hostel Management';
    const html = await emailTemplateService.getBookingConfirmationTemplate(bookingData);
    await this.sendEmail(to, subject, html);
  }
}

export const emailService = new EmailService();
