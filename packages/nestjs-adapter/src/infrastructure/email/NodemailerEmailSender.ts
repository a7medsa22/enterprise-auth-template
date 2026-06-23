import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IEmailSender, EmailMessage, Result } from '@auth-template/core';
import * as nodemailer from 'nodemailer';

@Injectable()
export class NodemailerEmailSender implements IEmailSender {
  private transporter: nodemailer.Transporter | null = null;
  private readonly logger = new Logger(NodemailerEmailSender.name);
  private readonly from: string;
  private readonly useFallback: boolean = false;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('email.smtp.host') || process.env.SMTP_HOST;
    const port = this.configService.get<number>('email.smtp.port') || parseInt(process.env.SMTP_PORT || '587', 10);
    const user = this.configService.get<string>('email.smtp.user') || process.env.SMTP_USER;
    const pass = this.configService.get<string>('email.smtp.pass') || process.env.SMTP_PASS;
    const secure = this.configService.get<boolean>('email.smtp.secure') || process.env.SMTP_SECURE === 'true';
    this.from = this.configService.get<string>('email.smtp.from') || process.env.SMTP_FROM || 'Auth Template <noreply@example.com>';

    if (!host || !user || !pass) {
      this.logger.warn(
        'SMTP configuration is missing or incomplete (SMTP_HOST, SMTP_USER, or SMTP_PASS). Falling back to logging emails to the console.',
      );
      this.useFallback = true;
    } else {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: {
          user,
          pass,
        },
      });
    }
  }

  async send(message: EmailMessage): Promise<Result<void>> {
    const mailOptions = {
      from: message.from || this.from,
      to: message.to,
      subject: message.subject,
      html: message.html,
      text: message.text,
    };

    if (this.useFallback) {
      this.logger.log(`
========================================
[EMAIL SENT (SANDBOX FALLBACK)]
To: ${mailOptions.to}
From: ${mailOptions.from}
Subject: ${mailOptions.subject}
Body:
${mailOptions.text || mailOptions.html}
========================================`);
      return Result.ok();
    }

    try {
      await this.transporter!.sendMail(mailOptions);
      this.logger.log(`Email successfully sent to ${message.to}`);
      return Result.ok();
    } catch (error) {
      this.logger.error(`Failed to send email to ${message.to}`, error);
      return Result.fail(`Email delivery failed: ${error}`);
    }
  }

  async sendVerificationEmail(email: string, token: string): Promise<Result<void>> {
    const verificationUrl = `${this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000')}/auth/verify-email?token=${token}`;
    return this.send({
      to: email,
      subject: 'Verify Your Email Address',
      html: `
        <h1>Email Verification</h1>
        <p>Please click the link below to verify your email address:</p>
        <a href="${verificationUrl}" target="_blank">Verify Email</a>
        <p>Or use this verification token directly:</p>
        <pre>${token}</pre>
      `,
      text: `Please verify your email address by visiting this link: ${verificationUrl} \n\nOr use this token directly:\n${token}`,
    });
  }

  async sendPasswordResetEmail(email: string, token: string): Promise<Result<void>> {
    const resetUrl = `${this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000')}/auth/reset-password?token=${token}`;
    return this.send({
      to: email,
      subject: 'Reset Your Password',
      html: `
        <h1>Password Reset Request</h1>
        <p>Please click the link below to reset your password:</p>
        <a href="${resetUrl}" target="_blank">Reset Password</a>
        <p>Or use this token directly:</p>
        <pre>${token}</pre>
      `,
      text: `Please reset your password by visiting this link: ${resetUrl} \n\nOr use this token directly:\n${token}`,
    });
  }

  async sendWelcomeEmail(email: string, name?: string): Promise<Result<void>> {
    const displayName = name || email;
    return this.send({
      to: email,
      subject: 'Welcome to Auth Template!',
      html: `
        <h1>Welcome!</h1>
        <p>Hello ${displayName},</p>
        <p>Thank you for registering. Your account has been successfully created.</p>
      `,
      text: `Hello ${displayName},\n\nThank you for registering. Your account has been successfully created.`,
    });
  }
}
