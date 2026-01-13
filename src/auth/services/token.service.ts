import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { TokenStorage } from "../interfaces/token-storage.interface";
import { TokenPayload } from "../interfaces/token-payload.interface";
import { User } from "../interfaces/user.interface";
import { TokenResponseDto } from "../dto/token-respons.dto";

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly tokenStorage: TokenStorage,
  ) {}

  async generateAccessToken(user: User): Promise<string> {
    const payload: TokenPayload = {
      sub: user.id,
      email: user.email,
      roles: user.roles,
    };

    return this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
      expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRATION', '15m'),
    });
  }

  async generateRefreshToken(user: User): Promise<string> {
    const payload: TokenPayload = {
      sub: user.id,
      email: user.email,
      roles: user.roles,
    };

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRATION', '7d'),
    });

    // Save to storage
    const expiresIn = this.parseExpirationToSeconds(
      this.configService.get<string>('JWT_REFRESH_EXPIRATION', '7d')
    );
    await this.tokenStorage.saveRefreshToken(user.id, refreshToken, expiresIn);

    return refreshToken;
  }

  async generateTokenPair(user: User): Promise<TokenResponseDto> {
    const [accessToken, refreshToken] = await Promise.all([
      this.generateAccessToken(user),
      this.generateRefreshToken(user),
    ]);

    return { accessToken, refreshToken };
  }

  async validateRefreshToken(userId: string, token: string): Promise<boolean> {
    return this.tokenStorage.validateRefreshToken(userId, token);
  }

  async revokeRefreshToken(userId: string, token: string): Promise<void> {
    await this.tokenStorage.revokeRefreshToken(userId, token);
  }

  async revokeAllRefreshTokens(userId: string): Promise<void> {
    await this.tokenStorage.revokeAllRefreshTokens(userId);
  }

  private parseExpirationToSeconds(expiration: string): number {
    const unit = expiration.slice(-1);
    const value = parseInt(expiration.slice(0, -1), 10);

    switch (unit) {
      case 's': return value;
      case 'm': return value * 60;
      case 'h': return value * 3600;
      case 'd': return value * 86400;
      default: return 900;
    }
  }
}