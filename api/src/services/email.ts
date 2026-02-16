import nodemailer from 'nodemailer';
import { logger } from '../utils/logger';

export class EmailService {
  private static transporter: nodemailer.Transporter;

  static async initialize(): Promise<void> {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'localhost',
      port: parseInt(process.env.SMTP_PORT || '1025'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: process.env.SMTP_USER ? {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      } : undefined,
    });

    // Verify connection
    try {
      await this.transporter.verify();
      logger.info('SMTP connection established');
    } catch (error) {
      logger.error('SMTP connection failed:', error);
    }
  }

  static async sendWelcomeEmail(email: string, firstName: string): Promise<void> {
    const mailOptions = {
      from: `${process.env.DEFAULT_FROM_NAME || 'BhaMail'} <${process.env.DEFAULT_FROM_EMAIL || 'noreply@bhamail.local'}>`,
      to: email,
      subject: 'Welcome to BhaMail!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb;">Welcome to BhaMail, ${firstName}!</h1>
          <p>Thank you for joining BhaMail. Your account has been successfully created.</p>
          <p>You can now:</p>
          <ul>
            <li>Send and receive emails</li>
            <li>Organize with labels and folders</li>
            <li>Search through your messages</li>
            <li>Set up filters and rules</li>
          </ul>
          <p>Get started by logging into your account:</p>
          <p>
            <a href="${process.env.WEB_BASE_URL || 'http://localhost:3000'}" 
               style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
               Access BhaMail
            </a>
          </p>
          <p>If you have any questions, please contact our support team.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">
            This email was sent by BhaMail. If you didn't create this account, please ignore this email.
          </p>
        </div>
      `,
      text: `
        Welcome to BhaMail, ${firstName}!
        
        Thank you for joining BhaMail. Your account has been successfully created.
        
        You can now:
        - Send and receive emails
        - Organize with labels and folders
        - Search through your messages
        - Set up filters and rules
        
        Get started by logging into your account: ${process.env.WEB_BASE_URL || 'http://localhost:3000'}
        
        If you have any questions, please contact our support team.
        
        If you didn't create this account, please ignore this email.
      `,
    };

    await this.transporter.sendMail(mailOptions);
    logger.info(`Welcome email sent to ${email}`);
  }

  static async sendPasswordResetEmail(email: string, firstName: string, resetToken: string): Promise<void> {
    const resetUrl = `${process.env.WEB_BASE_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    
    const mailOptions = {
      from: `${process.env.DEFAULT_FROM_NAME || 'BhaMail'} <${process.env.DEFAULT_FROM_EMAIL || 'noreply@bhamail.local'}>`,
      to: email,
      subject: 'Reset Your BhaMail Password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb;">Password Reset Request</h1>
          <p>Hello ${firstName},</p>
          <p>We received a request to reset your BhaMail password. If you didn't make this request, please ignore this email.</p>
          <p>To reset your password, click the button below:</p>
          <p>
            <a href="${resetUrl}" 
               style="background-color: #dc2626; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
               Reset Password
            </a>
          </p>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #666;">${resetUrl}</p>
          <p><strong>This link will expire in 1 hour.</strong></p>
          <p>If you're having trouble clicking the button, copy and paste the URL above into your web browser.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">
            This email was sent by BhaMail. If you didn't request a password reset, please ignore this email.
          </p>
        </div>
      `,
      text: `
        Password Reset Request
        
        Hello ${firstName},
        
        We received a request to reset your BhaMail password. If you didn't make this request, please ignore this email.
        
        To reset your password, visit this link: ${resetUrl}
        
        This link will expire in 1 hour.
        
        If you didn't request a password reset, please ignore this email.
      `,
    };

    await this.transporter.sendMail(mailOptions);
    logger.info(`Password reset email sent to ${email}`);
  }

  static async sendEmail(options: {
    from: string;
    to: string | string[];
    cc?: string | string[];
    bcc?: string | string[];
    subject: string;
    text?: string;
    html?: string;
    attachments?: any[];
  }): Promise<nodemailer.SentMessageInfo> {
    return await this.transporter.sendMail(options);
  }

  static getTransporter(): nodemailer.Transporter {
    if (!this.transporter) {
      throw new Error('Email service not initialized. Call EmailService.initialize() first.');
    }
    return this.transporter;
  }
}