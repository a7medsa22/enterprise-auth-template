import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { IEmailSender, EmailMessage, Result } from '@auth-template/core';

@Injectable()
export class QueueEmailSender implements IEmailSender {
  private readonly logger = new Logger(QueueEmailSender.name);

  constructor(@InjectQueue('email') private readonly emailQueue: Queue) {}

  async send(message: EmailMessage): Promise<Result<void>> {
    try {
      this.logger.log(`Enqueuing custom email to ${message.to}`);
      await this.emailQueue.add('send', { message });
      return Result.ok();
    } catch (error) {
      this.logger.error(`Failed to enqueue custom email to ${message.to}`, error);
      return Result.fail(`Failed to enqueue email: ${error}`);
    }
  }

  async sendVerificationEmail(email: string, token: string): Promise<Result<void>> {
    try {
      this.logger.log(`Enqueuing verification email to ${email}`);
      await this.emailQueue.add('sendVerificationEmail', { email, token });
      return Result.ok();
    } catch (error) {
      this.logger.error(`Failed to enqueue verification email to ${email}`, error);
      return Result.fail(`Failed to enqueue verification email: ${error}`);
    }
  }

  async sendPasswordResetEmail(email: string, token: string): Promise<Result<void>> {
    try {
      this.logger.log(`Enqueuing password reset email to ${email}`);
      await this.emailQueue.add('sendPasswordResetEmail', { email, token });
      return Result.ok();
    } catch (error) {
      this.logger.error(`Failed to enqueue password reset email to ${email}`, error);
      return Result.fail(`Failed to enqueue password reset email: ${error}`);
    }
  }

  async sendWelcomeEmail(email: string, name?: string): Promise<Result<void>> {
    try {
      this.logger.log(`Enqueuing welcome email to ${email}`);
      await this.emailQueue.add('sendWelcomeEmail', { email, name });
      return Result.ok();
    } catch (error) {
      this.logger.error(`Failed to enqueue welcome email to ${email}`, error);
      return Result.fail(`Failed to enqueue welcome email: ${error}`);
    }
  }
}
