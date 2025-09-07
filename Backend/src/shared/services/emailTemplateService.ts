import fs from 'fs';
import path from 'path';
import { authLogger } from '../utils/logger';

export interface EmailTemplateData {
  [key: string]: string | number;
}

export class EmailTemplateService {
  private templateDir: string;

  constructor() {
    this.templateDir = path.join(__dirname, '../../templates/email');
  }

  /**
   * Load and render email template
   */
  public async renderTemplate(templateName: string, data: EmailTemplateData): Promise<string> {
    try {
      const templatePath = path.join(this.templateDir, `${templateName}.html`);
      
      if (!fs.existsSync(templatePath)) {
        throw new Error(`Template not found: ${templateName}`);
      }

      let template = fs.readFileSync(templatePath, 'utf8');
      
      // Replace placeholders with actual data
      Object.keys(data).forEach(key => {
        const placeholder = `{{${key.toUpperCase()}}}`;
        template = template.replace(new RegExp(placeholder, 'g'), String(data[key]));
      });

      return template;
    } catch (error) {
      authLogger.logger.error('Failed to render email template', {
        templateName,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * Get OTP verification email template
   */
  public async getOTPVerificationTemplate(otp: string): Promise<string> {
    return this.renderTemplate('otp-verification', { OTP: otp });
  }

  /**
   * Get password reset email template
   */
  public async getPasswordResetTemplate(resetUrl: string): Promise<string> {
    return this.renderTemplate('password-reset', { RESET_URL: resetUrl });
  }

  /**
   * Get booking confirmation email template
   */
  public async getBookingConfirmationTemplate(bookingData: {
    bookingId: string;
    hostelName: string;
    roomType: string;
    checkinDate: string;
    checkoutDate: string;
    totalAmount: number;
  }): Promise<string> {
    return this.renderTemplate('booking-confirmation', {
      BOOKING_ID: bookingData.bookingId,
      HOSTEL_NAME: bookingData.hostelName,
      ROOM_TYPE: bookingData.roomType,
      CHECKIN_DATE: bookingData.checkinDate,
      CHECKOUT_DATE: bookingData.checkoutDate,
      TOTAL_AMOUNT: bookingData.totalAmount
    });
  }

  /**
   * Get available templates
   */
  public getAvailableTemplates(): string[] {
    try {
      const files = fs.readdirSync(this.templateDir);
      return files
        .filter(file => file.endsWith('.html'))
        .map(file => file.replace('.html', ''));
    } catch (error) {
      authLogger.logger.error('Failed to get available templates', {
        error: error instanceof Error ? error.message : String(error)
      });
      return [];
    }
  }
}

export const emailTemplateService = new EmailTemplateService();
