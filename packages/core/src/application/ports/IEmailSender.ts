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
  sendVerificationEmail(email: string, token: string): Promise<Result<void>>;
  sendPasswordResetEmail(email: string, token: string): Promise<Result<void>>;
  sendWelcomeEmail(email: string, name?: string): Promise<Result<void>>;
}
