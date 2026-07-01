import { RefreshToken, TokenId, UserId, Token } from '@auth-template/core/domain';
import { RefreshTokenEntity } from '../entities/RefreshTokenEntity';

export class RefreshTokenMapper {
  public static toDomain(entity: RefreshTokenEntity): RefreshToken {
    const tokenOrError = Token.create(entity.token);
    if (tokenOrError.isFailure) {
      throw new Error(`Invalid token in database: ${tokenOrError.error}`);
    }

    const refreshTokenOrError = RefreshToken.restore({
      id: TokenId.create(entity.id),
      userId: UserId.create(entity.userId),
      token: tokenOrError.getValue(),
      isRevoked: entity.isRevoked,
      expiresAt: entity.expiresAt,
      createdAt: entity.createdAt,
    });

    if (refreshTokenOrError.isFailure) {
      throw new Error(`Failed to restore RefreshToken from database: ${refreshTokenOrError.error}`);
    }

    return refreshTokenOrError.getValue();
  }

  public static toPersistence(domain: RefreshToken): RefreshTokenEntity {
    const entity = new RefreshTokenEntity();
    entity.id = domain.id.getValue();
    entity.userId = domain.getUserId().getValue();
    entity.token = domain.getToken().getValue();
    entity.isRevoked = domain.getIsRevoked();
    entity.expiresAt = domain.getExpiresAt();
    entity.createdAt = domain.getCreatedAt();
    return entity;
  }
}
