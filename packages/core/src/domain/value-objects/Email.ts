import { Result } from "../../shared/utils/Result";

export class Email {
  private readonly value: string;

  private constructor(email: string) {
    this.value = email;
  }

  public static create(email: string): Result<Email> {
    if (!email || email.trim().length === 0) {
      return Result.fail('Email cannot be empty');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return Result.fail('Invalid email format');
    }

    return Result.ok(new Email(email.toLowerCase()));
  }

  public getValue(): string {
    return this.value;
  }

  public equals(email: Email): boolean {
    return this.value === email.value;
  }
}