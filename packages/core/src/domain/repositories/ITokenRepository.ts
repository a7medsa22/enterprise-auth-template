import { Result } from '../../shared/utils/Result';
import { RefreshToken } from '../entities/RefreshToken';
import { Token } from '../value-objects/Token';
import { TokenId } from '../value-objects/TokenId';
import { UserId } from '../value-objects/UserId';

export interface ITokenRepository {
  findById(id: TokenId): Promise<Result<RefreshToken>>;
  findByToken(token: Token): Promise<Result<RefreshToken>>;
  findByUserId(userId: UserId): Promise<Result<RefreshToken[]>>;
  save(refreshToken: RefreshToken): Promise<Result<void>>;
  update(refreshToken: RefreshToken): Promise<Result<void>>;
  delete(id: TokenId): Promise<Result<void>>;
  deleteByUserId(userId: UserId): Promise<Result<void>>;
  deleteExpired(): Promise<Result<number>>;
  deleteRevoked(): Promise<Result<number>>;
}