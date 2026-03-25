import { Injectable, Logger, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import * as fs from 'fs';
import * as path from 'path';
import { compile } from 'handlebars';

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
  private readonly resend: Resend;
  private readonly frontendUrl: string;
  private readonly fromEmail: string;

  constructor(
    @Inject('RESEND_CLIENT') resend: Resend,
    private readonly configService: ConfigService,
  ) {
    this.resend = resend;
    this.frontendUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';
    this.fromEmail =
      this.configService.get<string>('RESEND_FROM_EMAIL') ||
      'onboarding@resend.dev';
  }

  /**
   * Compile Handlebars template
   */
  private compileTemplate(
    templateName: string,
    context: Record<string, unknown>,
  ): string {
    const templatePath = path.join(
      __dirname,
      'templates',
      `${templateName}.hbs`,
    );

    if (!fs.existsSync(templatePath)) {
      this.logger.error(`Template not found: ${templatePath}`);
      throw new Error(`Template not found: ${templateName}`);
    }

    const templateContent = fs.readFileSync(templatePath, 'utf-8');
    const template = compile(templateContent);

    return template({
      ...context,
      frontendUrl: this.frontendUrl,
      year: new Date().getFullYear(),
    });
  }

  /**
   * Send email using Handlebars template
   */
  async sendTemplateEmail(options: SendTemplateEmailOptions): Promise<void> {
    try {
      const html = this.compileTemplate(options.template, {
        ...options.context,
        to: options.to,
      });

      await this.resend.emails.send({
        from: this.fromEmail,
        to: options.to,
        subject: options.subject,
        html,
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
      const emailData: any = {
        from: this.fromEmail,
        to: options.to,
        subject: options.subject,
      };

      // Only include html or text if defined (Resend requires at least one)
      if (options.html) {
        emailData.html = options.html;
      } else if (options.text) {
        emailData.text = options.text;
      }

      await this.resend.emails.send(emailData);

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
