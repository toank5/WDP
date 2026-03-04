import transporter from './nodemailer.config';
import { SendMailOptions } from 'nodemailer';

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

// Extend nodemailer options to include template properties
interface TemplateMailOptions extends SendMailOptions {
  template: string;
  context: Record<string, unknown>;
}

/**
 * Send email using Handlebars template
 */
export async function sendTemplateEmail(
  options: SendTemplateEmailOptions,
): Promise<void> {
  try {
    const mailOptions: TemplateMailOptions = {
      from: `"EyeWear" <${process.env.MAIL_FROM || process.env.SMTP_USER}>`,
      to: options.to,
      subject: options.subject,
      template: options.template,
      context: {
        ...options.context,
        frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
        to: options.to,
        year: new Date().getFullYear(),
      },
    };
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Failed to send email:', error);
    throw error;
  }
}

/**
 * Send plain HTML email (for non-template emails)
 */
export async function sendEmail(options: SendEmailOptions): Promise<void> {
  try {
    await transporter.sendMail({
      from: `"EyeWear" <${process.env.MAIL_FROM || process.env.SMTP_USER}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });
  } catch (error) {
    console.error('Failed to send email:', error);
    throw error;
  }
}

/**
 * Send email verification email
 */
export async function sendVerificationEmail(
  email: string,
  name: string,
  verifyUrl: string,
): Promise<void> {
  await sendTemplateEmail({
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
export async function sendPasswordResetEmail(
  email: string,
  name: string,
  resetUrl: string,
): Promise<void> {
  await sendTemplateEmail({
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
export async function sendOrderConfirmationEmail(
  email: string,
  name: string,
  orderNumber: string,
  orderDetails: {
    items: Array<{ name: string; quantity: number; price: number }>;
    totalAmount: number;
    shippingAddress: string;
  },
): Promise<void> {
  await sendTemplateEmail({
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
export async function sendOrderShippedEmail(
  email: string,
  name: string,
  orderNumber: string,
  trackingNumber: string,
  trackingUrl: string,
): Promise<void> {
  await sendTemplateEmail({
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
