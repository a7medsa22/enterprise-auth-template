import { ITokenRepository, RefreshToken, TokenId, UserId, Token } from '@auth-template/core/domain';
import { Repository, LessThan } from 'typeorm';
import { RefreshTokenEntity } from '../entities/RefreshTokenEntity';
import { Result } from '@auth-template/core';
import { RefreshTokenMapper } from '../mappers/RefreshTokenMapper';

export class BaseTypeOrmTokenRepository implements ITokenRepository {
  constructor(protected readonly repository: Repository<RefreshTokenEntity>) {}

  async findById(id: TokenId): Promise<Result<RefreshToken>> {
    try {
      const entity = await this.repository.findOne({
        where: { id: id.getValue() },
      });
      if (!entity) return Result.fail('Refresh token not found');

      const token = RefreshTokenMapper.toDomain(entity);
      return Result.ok(token);
    } catch (error) {
      return Result.fail(`Failed to find refresh token: ${error}`);
    }
  }

  async findByToken(token: Token): Promise<Result<RefreshToken>> {
    try {
      const entity = await this.repository.findOne({
        where: { token: token.getValue() },
      });
      if (!entity) return Result.fail('Refresh token not found');

      const domainToken = RefreshTokenMapper.toDomain(entity);
      return Result.ok(domainToken);
    } catch (error) {
      return Result.fail(`Failed to find refresh token by value: ${error}`);
    }
  }

  async findByUserId(userId: UserId): Promise<Result<RefreshToken[]>> {
    try {
      const entities = await this.repository.find({
        where: { userId: userId.getValue() },
      });
      const tokens = entities.map((entity) => RefreshTokenMapper.toDomain(entity));
      return Result.ok(tokens);
    } catch (error) {
      return Result.fail(`Failed to find refresh tokens by user ID: ${error}`);
    }
  }

  async save(refreshToken: RefreshToken): Promise<Result<void>> {
    try {
      const entity = RefreshTokenMapper.toPersistence(refreshToken);
      await this.repository.save(entity);
      return Result.ok();
    } catch (error) {
      return Result.fail(`Failed to save refresh token: ${error}`);
    }
  }

  async update(refreshToken: RefreshToken): Promise<Result<void>> {
    try {
      const entity = RefreshTokenMapper.toPersistence(refreshToken);
      await this.repository.save(entity);
      return Result.ok();
    } catch (error) {
      return Result.fail(`Failed to update refresh token: ${error}`);
    }
  }

  async delete(id: TokenId): Promise<Result<void>> {
    try {
      await this.repository.delete({ id: id.getValue() });
      return Result.ok();
    } catch (error) {
      return Result.fail(`Failed to delete refresh token: ${error}`);
    }
  }

  async deleteByUserId(userId: UserId): Promise<Result<void>> {
    try {
      await this.repository.delete({ userId: userId.getValue() });
      return Result.ok();
    } catch (error) {
      return Result.fail(`Failed to delete refresh tokens by user ID: ${error}`);
    }
  }

  async deleteExpired(): Promise<Result<number>> {
    try {
      const result = await this.repository.delete({
        expiresAt: LessThan(new Date()),
      });
      return Result.ok(result.affected || 0);
    } catch (error) {
      return Result.fail(`Failed to delete expired refresh tokens: ${error}`);
    }
  }

  async deleteRevoked(): Promise<Result<number>> {
    try {
      const result = await this.repository.delete({
        isRevoked: true,
      });
      return Result.ok(result.affected || 0);
    } catch (error) {
      return Result.fail(`Failed to delete revoked refresh tokens: ${error}`);
    }
  }
}
