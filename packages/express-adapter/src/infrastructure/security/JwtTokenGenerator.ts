import * as jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { ITokenGenerator, TokenPayload } from '@auth-template/core/application';
import { Result, UserId, ITokenRepository, RefreshToken, Token } from '@auth-template/core';
import { AuthConfig } from '../../config';

export class JwtTokenGenerator implements ITokenGenerator {
  private readonly config: AuthConfig;
  private readonly tokenRepository: ITokenRepository;

  constructor(config: AuthConfig, tokenRepository: ITokenRepository) {
    this.config = config;
    this.tokenRepository = tokenRepository;

    if (!this.config.jwt.accessSecret || !this.config.jwt.refreshSecret) {
      throw new Error('JWT secrets are not properly configured');
    }
  }

  async generateAccessToken(userId: UserId, payload: TokenPayload): Promise<Result<string>> {
    try {
      const token = jwt.sign(payload, this.config.jwt.accessSecret, {
        expiresIn: this.config.jwt.accessExpiration as any,
        subject: userId.getValue(),
        algorithm: 'HS256',
      });
      return Result.ok(token);
    } catch (error) {
      return Result.fail(`Failed to generate access token: ${error}`);
    }
  }

  async generateRefreshToken(userId: UserId): Promise<Result<string>> {
    try {
      const jti = randomUUID();
      const token = jwt.sign({ type: 'refresh', jti }, this.config.jwt.refreshSecret, {
        expiresIn: this.config.jwt.refreshExpiration as any,
        subject: userId.getValue(),
      });

      const tokenOrError = Token.create(token);
      if (tokenOrError.isFailure) {
        return Result.fail(`Invalid refresh token: ${tokenOrError.error}`);
      }

      const expiresAt = new Date(Date.now() + this.getRefreshTokenExpiration() * 1000);
      const refreshTokenOrError = RefreshToken.create({
        userId,
        token: tokenOrError.getValue(),
        expiresAt,
      });

      if (refreshTokenOrError.isFailure) {
        return Result.fail(`Failed to create RefreshToken: ${refreshTokenOrError.error}`);
      }

      const saveResult = await this.tokenRepository.save(refreshTokenOrError.getValue());
      if (saveResult.isFailure) {
        return Result.fail(`Failed to save refresh token: ${saveResult.error}`);
      }

      return Result.ok(token);
    } catch (error) {
      return Result.fail(`Failed to generate refresh token: ${error}`);
    }
  }

  async verifyAccessToken(token: string): Promise<Result<TokenPayload>> {
    try {
      const payload = jwt.verify(token, this.config.jwt.accessSecret, {
        algorithms: ['HS256'],
      }) as TokenPayload;
      return Result.ok(payload);
    } catch (error) {
      return Result.fail(`Invalid or expired access token: ${error}`);
    }
  }

  async verifyRefreshToken(token: string): Promise<Result<UserId>> {
    try {
      const payload = jwt.verify(token, this.config.jwt.refreshSecret) as any;
      if (payload.type !== 'refresh') {
        return Result.fail('Invalid token type');
      }

      if (!payload.sub) {
        return Result.fail('Invalid token payload');
      }

      return Result.ok(UserId.create(payload.sub));
    } catch (error) {
      return Result.fail(`Invalid or expired refresh token: ${error}`);
    }
  }

  getAccessTokenExpiration(): number {
    return this.parseExpirationToSeconds(this.config.jwt.accessExpiration);
  }

  getRefreshTokenExpiration(): number {
    return this.parseExpirationToSeconds(this.config.jwt.refreshExpiration);
  }

  private parseExpirationToSeconds(expiration: string): number {
    const unit = expiration.slice(-1);
    const value = parseInt(expiration.slice(0, -1), 10);

    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 3600;
      case 'd':
        return value * 86400;
      default:
        return 900; // 15 minutes default
    }
  }
}
