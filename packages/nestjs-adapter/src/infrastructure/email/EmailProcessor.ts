import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { NodemailerEmailSender } from './NodemailerEmailSender';

@Processor('email')
export class EmailProcessor {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(private readonly emailSender: NodemailerEmailSender) {}

  @Process('send')
  async handleSend(job: Job<{ message: any }>) {
    this.logger.log(`Processing custom email job: ${job.id}`);
    const { message } = job.data;
    const result = await this.emailSender.send(message);
    if (result.isFailure) {
      throw new Error(result.error);
    }
  }

  @Process('sendVerificationEmail')
  async handleSendVerification(job: Job<{ email: string; token: string }>) {
    this.logger.log(`Processing verification email job: ${job.id} for ${job.data.email}`);
    const { email, token } = job.data;
    const result = await this.emailSender.sendVerificationEmail(email, token);
    if (result.isFailure) {
      throw new Error(result.error);
    }
  }

  @Process('sendPasswordResetEmail')
  async handleSendPasswordReset(job: Job<{ email: string; token: string }>) {
    this.logger.log(`Processing password reset email job: ${job.id} for ${job.data.email}`);
    const { email, token } = job.data;
    const result = await this.emailSender.sendPasswordResetEmail(email, token);
    if (result.isFailure) {
      throw new Error(result.error);
    }
  }

  @Process('sendWelcomeEmail')
  async handleSendWelcome(job: Job<{ email: string; name?: string }>) {
    this.logger.log(`Processing welcome email job: ${job.id} for ${job.data.email}`);
    const { email, name } = job.data;
    const result = await this.emailSender.sendWelcomeEmail(email, name);
    if (result.isFailure) {
      throw new Error(result.error);
    }
  }
}
