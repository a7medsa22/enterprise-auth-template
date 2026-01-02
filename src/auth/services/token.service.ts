import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {RefreshTokenPayload} from '../interfaces/token-payload.interface';
import { randomUUID } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { User } from '../interfaces/user.interface';
import type { TokenStorage } from '../interfaces/token-storage.interface';

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly tokenStorage: TokenStorage,
  ) {}

  async rotateRefreshToken(refreshToken: string) {
    const payload = await this.jwtService.verifyAsync<RefreshTokenPayload>(
      refreshToken,
      {
        secret: this.config.get('JWT_REFRESH_SECRET'),
      },
    );
    const exists = await this.tokenStorage.exists(payload.sub, payload.tokenId);

    if (!exists) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    await this.tokenStorage.revoke(payload.sub, payload.tokenId);

    // Return the userId so the caller can fetch the user and issue new tokens
    return {
      userId: payload.sub,
    };
  }

  async revokeRefreshToken(refreshToken: string) {
    try {
      const payload = await this.jwtService.verifyAsync<RefreshTokenPayload>(
        refreshToken,
        {
          secret: this.config.get('JWT_REFRESH_SECRET'),
        },
      );
      await this.tokenStorage.revoke(payload.sub, payload.tokenId);
    } catch (e) {
      // Ignore errors during revocation (e.g. token already expired)
    }
  }

  async issueRefreshToken(userId: string) {
    const tokenId = randomUUID();

    const refreshToken = this.jwtService.sign(
      { sub: userId, tokenId },
      {
        secret: this.config.get('JWT_REFRESH_SECRET'),
        expiresIn: this.config.get('JWT_REFRESH_EXPIRATION', '7d'),
      },
    );
    const refreshExpiresInSeconds = this.parseExpirationToSeconds(
      this.config.get('JWT_REFRESH_EXPIRATION', '7d'),
    );
    await this.tokenStorage.save(userId, tokenId, refreshExpiresInSeconds);

    return refreshToken;
  }

  async issueAccessToken(user: User): Promise<string> {
    const payload = { 
      sub: user.id,
      email: user.email,
      roles: user.roles 
    };
    return this.jwtService.signAsync(payload, {
      secret: this.config.get('JWT_ACCESS_SECRET'), // Changed to match Strategy
      expiresIn: this.config.get('JWT_ACCESS_EXPIRATION', '15m'),
    });
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
