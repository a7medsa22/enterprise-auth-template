import { Result } from '../../../shared/utils/Result';
import { UserId } from '../../../domain/value-objects/UserId';
import { Token } from '../../../domain/value-objects/Token';
import { ITokenRepository } from '../../../domain/repositories/ITokenRepository';
import { ILogger } from '../../ports/ILogger';

export interface LogoutUserDTO {
  userId: string;
  refreshToken: string;
}

export class LogoutUser {
  constructor(
    private readonly tokenRepository: ITokenRepository,
    private readonly logger: ILogger,
  ) {}

  async execute(dto: LogoutUserDTO): Promise<Result<void>> {
    // 1. Create value objects
    const userId = UserId.create(dto.userId);
    const tokenOrError = Token.create(dto.refreshToken);

    if (tokenOrError.isFailure) {
      return Result.fail('Invalid token');
    }
    const token = tokenOrError.getValue();

    // 2. Find token
    const refreshTokenOrError = await this.tokenRepository.findByToken(token);
    if (refreshTokenOrError.isFailure) {
      this.logger.warn('Logout attempted with non-existent token');
      return Result.ok(); // Already logged out, treat as success
    }

    const refreshToken = refreshTokenOrError.getValue();

    // 3. Verify ownership
    if (!refreshToken.getUserId().equals(userId)) {
      this.logger.warn('Logout attempted with token belonging to different user');
      return Result.fail('Invalid token');
    }

    // 4. Revoke token
    const revokeResult = refreshToken.revoke();
    if (revokeResult.isFailure) {
      return Result.fail(revokeResult.error);
    }

    // 5. Update in repository
    const updateOrError = await this.tokenRepository.update(refreshToken);
    if (updateOrError.isFailure) {
      this.logger.error('Failed to revoke refresh token', new Error(updateOrError.error));
      return Result.fail('Unable to logout');
    }

    this.logger.info('User logged out successfully', { userId: dto.userId });
    return Result.ok();
  }
}
