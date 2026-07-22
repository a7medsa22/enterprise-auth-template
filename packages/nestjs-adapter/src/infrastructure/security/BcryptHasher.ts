import { Injectable } from '@nestjs/common';
import { IPasswordHasher } from '@auth-template/core/application';
import { Result, PasswordValidator } from '@auth-template/core';
import * as bcrypt from 'bcryptjs';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class BcryptHasher implements IPasswordHasher {
  private readonly rounds: number;
  constructor(private readonly configService: ConfigService) {
    const configuredRounds = this.configService.get<any>('BCRYPT_ROUNDS', 10);
    this.rounds =
      typeof configuredRounds === 'number' ? configuredRounds : parseInt(configuredRounds, 10);
    if (isNaN(this.rounds)) {
      this.rounds = 10;
    }
  }
  async hash(password: string): Promise<Result<string>> {
    try {
      const hashed = await bcrypt.hash(password, this.rounds);
      return Result.ok(hashed);
    } catch (error) {
      return Result.fail(`Failed to hash password: ${error}`);
    }
  }
  async compare(password: string, hashed: string): Promise<Result<boolean>> {
    try {
      const isMatch = await bcrypt.compare(password, hashed);
      return Result.ok(isMatch);
    } catch (error) {
      return Result.fail(`Failed to compare passwords: ${error}`);
    }
  }

  validate(password: string): Result<void> {
    return PasswordValidator.validate(password);
  }
}
