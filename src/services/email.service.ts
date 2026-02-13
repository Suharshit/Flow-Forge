import { Resend } from 'resend';

export class EmailService {
    private resend: Resend;
    private fromEmail: string;
    private appName: string;

    constructor() {
        const apiKey = process.env.RESEND_API_KEY;

        if (!apiKey) {
            throw new Error('RESEND_API_KEY environment variable is not set');
        }

        this.resend = new Resend(apiKey);
        this.fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
        this.appName = process.env.APP_NAME || 'FlowForge';
    }

    async sendVerificationEmail(
        to: string,
        name: string,
        verificationToken: string
    ): Promise<void> {
        const verificationUrl = `${process.env.APP_BASE_URL}/api/auth/user/verify-email?token=${verificationToken}`;

        try {
            await this.resend.emails.send({
                from: `${this.appName} <${this.fromEmail}>`,
                to: [to],
                subject: `Verify your ${this.appName} account`,
                html: this.getVerificationEmailTemplate(name, verificationUrl),
            });

            console.log(`✅ Verification email sent to ${to}`);
        } catch (error) {
            console.error('Failed to send verification email:', error);
            throw new Error('Failed to send verification email');
        }
    }

    async sendPasswordResetEmail(
        to: string,
        name: string,
        resetToken: string
    ): Promise<void> {
        const resetUrl = `${process.env.APP_BASE_URL}/reset-password?token=${resetToken}`;

        try {
            await this.resend.emails.send({
                from: `${this.appName} <${this.fromEmail}>`,
                to: [to],
                subject: `Reset your ${this.appName} password`,
                html: this.getPasswordResetTemplate(name, resetUrl),
            });

            console.log(`✅ Password reset email sent to ${to}`);
        } catch (error) {
            console.error('Failed to send password reset email:', error);
            throw new Error('Failed to send password reset email');
        }
    }

    async sendWelcomeEmail(to: string, name: string): Promise<void> {
        try {
            await this.resend.emails.send({
                from: `${this.appName} <${this.fromEmail}>`,
                to: [to],
                subject: `Welcome to ${this.appName}! 🚀`,
                html: this.getWelcomeEmailTemplate(name),
            });

            console.log(`✅ Welcome email sent to ${to}`);
        } catch (error) {
            console.error('Failed to send welcome email:', error);
        }
    }

    private getVerificationEmailTemplate(name: string, verificationUrl: string): string {
        return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; }
          .button { display: inline-block; background: #667eea; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">Welcome to ${this.appName}! 🚀</h1>
          </div>
          <div class="content">
            <p>Hi ${name},</p>
            <p>Thanks for signing up! Please verify your email address to get started:</p>
            <div style="text-align: center;">
              <a href="${verificationUrl}" class="button">Verify Email Address</a>
            </div>
            <p>Or copy this link: <br>${verificationUrl}</p>
            <p><strong>This link expires in 24 hours.</strong></p>
            <p>If you didn't create this account, you can ignore this email.</p>
            <p>Best,<br>The ${this.appName} Team</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} ${this.appName}</p>
          </div>
        </div>
      </body>
      </html>
    `;
    }

    private getPasswordResetTemplate(name: string, resetUrl: string): string {
        return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; }
          .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Reset Your Password</h1>
          <p>Hi ${name},</p>
          <p>Click the button below to reset your password:</p>
          <div style="text-align: center;">
            <a href="${resetUrl}" class="button">Reset Password</a>
          </div>
          <p>Or copy this link: ${resetUrl}</p>
          <div class="warning">
            <strong>⚠️ This link expires in 1 hour</strong>
          </div>
          <p>If you didn't request this, ignore this email.</p>
        </div>
      </body>
      </html>
    `;
    }

    private getWelcomeEmailTemplate(name: string): string {
        return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🎉 Welcome to ${this.appName}!</h1>
          <p>Hi ${name},</p>
          <p>Your email is verified! You can now:</p>
          <ul>
            <li>Connect your Gmail account</li>
            <li>Set up Notion integration</li>
            <li>Create automated workflows</li>
            <li>Track job applications automatically</li>
          </ul>
          <p>Happy automating! 🚀</p>
        </div>
      </body>
      </html>
    `;
    }
}
