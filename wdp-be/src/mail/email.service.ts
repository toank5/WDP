import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailerService } from '@nestjs-modules/mailer';

interface SendTemplateEmailOptions {
  to: string;
  subject: string;
  template:
    | 'verify-email'
    | 'reset-password'
    | 'order-confirmation'
    | 'order-shipped';
  context: Record<string, unknown>;
}

interface SendEmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly frontendUrl: string;

  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {
    this.frontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';
  }

  /**
   * Send email using Handlebars template
   */
  async sendTemplateEmail(options: SendTemplateEmailOptions): Promise<void> {
    try {
      await this.mailerService.sendMail({
        to: options.to,
        subject: options.subject,
        template: options.template,
        context: {
          ...options.context,
          frontendUrl: this.frontendUrl,
          to: options.to,
          year: new Date().getFullYear(),
        },
      });
      this.logger.log(
        `Template email sent to ${options.to}: ${options.subject}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send template email to ${options.to}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Send plain HTML email (for non-template emails)
   */
  async sendEmail(options: SendEmailOptions): Promise<void> {
    try {
      await this.mailerService.sendMail({
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      });
      this.logger.log(`Email sent to ${options.to}: ${options.subject}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${options.to}:`, error);
      throw error;
    }
  }

  /**
   * Send email verification email
   */
  async sendVerificationEmail(
    email: string,
    name: string,
    verifyUrl: string,
  ): Promise<void> {
    await this.sendTemplateEmail({
      to: email,
      subject: 'Verify your EyeWear account',
      template: 'verify-email',
      context: {
        name,
        verifyUrl,
      },
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(
    email: string,
    name: string,
    resetUrl: string,
  ): Promise<void> {
    await this.sendTemplateEmail({
      to: email,
      subject: 'Reset your EyeWear password',
      template: 'reset-password',
      context: {
        name,
        resetUrl,
      },
    });
  }

  /**
   * Send order confirmation email
   */
  async sendOrderConfirmationEmail(
    email: string,
    name: string,
    orderNumber: string,
    orderDetails: {
      items: Array<{ name: string; quantity: number; price: number }>;
      totalAmount: number;
      shippingAddress: string;
    },
  ): Promise<void> {
    await this.sendTemplateEmail({
      to: email,
      subject: `Order Confirmation - ${orderNumber}`,
      template: 'order-confirmation',
      context: {
        name,
        orderNumber,
        orderDetails,
      },
    });
  }

  /**
   * Send order shipped email
   */
  async sendOrderShippedEmail(
    email: string,
    name: string,
    orderNumber: string,
    trackingNumber: string,
    trackingUrl: string,
  ): Promise<void> {
    await this.sendTemplateEmail({
      to: email,
      subject: `Your order ${orderNumber} has been shipped!`,
      template: 'order-shipped',
      context: {
        name,
        orderNumber,
        trackingNumber,
        trackingUrl,
      },
    });
  }
}
