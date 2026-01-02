import { Repository } from "typeorm";
import { TokenStorage } from "../interfaces/token-storage.interface";
import { InjectRepository } from "@nestjs/typeorm";

export class DatabaseTokenStorageAdapter implements TokenStorage {
    constructor(
        @InjectRepository(RefreshToken)
        private readonly tokenRepository: Repository<RefreshToken>,

    ) {}

 async saveRefreshToken(userId: string, token: string, expiresIn: Date): Promise<void> {
    const expiresAt  = new Date(Date.now() + expiresIn.getTime());
    
    const refreshToken = this.tokenRepository.create({
      userId,
      token,
      expiresAt,
    });

    await this.tokenRepository.save(refreshToken);
    
    // Clean up expired tokens periodically
    await this.tokenRepository.delete({
      expiresAt: new Date(Date.now() - 1000),
    });
  }

  async validateRefreshToken(userId: string, token: string): Promise<boolean> {
    const tokenEntity = await this.tokenRepository.findOne({
      where: { userId, token, isRevoked: false },
    });

    if (!tokenEntity) return false;
    
    const isExpired = tokenEntity.expiresAt < new Date();
    return !isExpired;
  }

  async revokeRefreshToken(userId: string, token: string): Promise<void> {
    await this.tokenRepository.update(
      { userId, token },
      { isRevoked: true },
    );
  }

  async revokeAllRefreshTokens(userId: string): Promise<void> {
    await this.tokenRepository.update(
      { userId },
      { isRevoked: true },
    );
  }
}