import { Email } from '../../domain/value-objects/Email';
import { Result } from '../../shared/utils/Result';

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

export interface IEmailSender {
  send(message: EmailMessage): Promise<Result<void>>;
  sendVerificationEmail(email: Email, token: string): Promise<Result<void>>;
  sendPasswordResetEmail(email: Email, token: string): Promise<Result<void>>;
  sendWelcomeEmail(email: Email, name?: string): Promise<Result<void>>;
}
