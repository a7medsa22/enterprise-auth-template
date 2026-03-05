import { Injectable } from "@nestjs/common";
import { ITokenGenerator, TokenPayload } from "@auth-template/core/application";
import { Result } from "@auth-template/core";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { UserId } from "@auth-template/core/domain";
import { randomUUID } from 'crypto';

@Injectable()
export class JwtTokenGenerator implements ITokenGenerator {
  private readonly accessTokenSecret: string;
  private readonly refreshTokenSecret: string;
  private readonly accessTokenExpiry: string;
  private readonly refreshTokenExpiry: string;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.accessTokenSecret = this.configService.get<string>('JWT_ACCESS_SECRET')!;
    this.refreshTokenSecret = this.configService.get<string>('JWT_REFRESH_SECRET')!;
    this.accessTokenExpiry = this.configService.get<string>('JWT_ACCESS_EXPIRATION', '15m');
    this.refreshTokenExpiry = this.configService.get<string>('JWT_REFRESH_EXPIRATION', '7d');

    if (!this.accessTokenSecret || !this.refreshTokenSecret){ 
        throw new Error('JWT secrets are not properly configured');
    }
  }

  async generateAccessToken(userId: UserId, payload: TokenPayload): Promise<Result<string>> {
    try {
      const token = this.jwtService.sign(payload,{
        secret: this.accessTokenSecret,
        expiresIn: this.accessTokenExpiry,
        subject: userId.getValue(),
        algorithm: 'HS256'
      });
      return Result.ok(token);
    } catch (error) {
      return Result.fail(`Failed to generate access token`);
    }
  }

  async generateRefreshToken(userId: UserId): Promise<Result<string>> {
    try {
      const jti = randomUUID();
      const token = this.jwtService.sign(
        { type: 'refresh', jti },
        {
          secret: this.refreshTokenSecret,
          expiresIn: this.refreshTokenExpiry,
          subject: userId.getValue(),
        },
      );
      return Result.ok(token);
    } catch (error) {
      return Result.fail(`Failed to generate refresh token`);
    }
  }

  async verifyAccessToken(token: string): Promise<Result<TokenPayload>> {
    try {
      const payload = this.jwtService.verify<TokenPayload>(token, {
        secret: this.accessTokenSecret,
        algorithms:['HS256']
      });
      return Result.ok(payload);
    } catch (error) {
      return Result.fail(`Invalid or expired access token`);
    }
  }

  async verifyRefreshToken(token: string): Promise<Result<UserId>> {
    try {
      const payload = this.jwtService.verify(token, {
        secret: this.refreshTokenSecret,
      });
      if(payload.type !== 'refresh') {
        return Result.fail('Invalid token type');
      }

      if (!payload.sub) {
        return Result.fail('Invalid token payload');
      }

      return Result.ok(UserId.create(payload.sub));
    } catch (error) {
      return Result.fail(`Invalid or expired refresh token`);
    }
  }

  getAccessTokenExpiration(): number {
    return this.parseExpirationToSeconds(this.accessTokenExpiry);
  }

  getRefreshTokenExpiration(): number {
    return this.parseExpirationToSeconds(this.refreshTokenExpiry);
  }

  private parseExpirationToSeconds(expiration: string): number {
    const unit = expiration.slice(-1);
    const value = parseInt(expiration.slice(0, -1), 10);

    switch (unit) {
      case 's': return value;
      case 'm': return value * 60;
      case 'h': return value * 3600;
      case 'd': return value * 86400;
      default: return 900; // 15 minutes default
    }
  }
}
