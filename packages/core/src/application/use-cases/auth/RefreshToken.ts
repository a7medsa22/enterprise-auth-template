import { Result } from '../../../shared/utils/Result';
import { Token } from '../../../domain/value-objects/Token';
import { RefreshToken } from '../../../domain/entities/RefreshToken';
import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { ITokenRepository } from '../../../domain/repositories/ITokenRepository';
import { ITokenGenerator, TokenPayload } from '../../ports/ITokenGenerator';
import { ILogger } from '../../ports/ILogger';

export interface RefreshTokenDTO {
  refreshToken: string;
}

export interface RefreshTokenResult {
  accessToken: string;
  refreshToken: string;
}

export class RefreshTokenUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly tokenRepository: ITokenRepository,
    private readonly tokenGenerator: ITokenGenerator,
    private readonly logger: ILogger,
  ) {}

  async execute(dto: RefreshTokenDTO): Promise<Result<RefreshTokenResult>> {
    // 1. Validate token format
    const tokenOrError = Token.create(dto.refreshToken);
    if (tokenOrError.isFailure) {
      return Result.fail('Invalid token');
    }
    const token = tokenOrError.getValue();

    // 2. Verify token with generator
    const userIdOrError = await this.tokenGenerator.verifyRefreshToken(
      dto.refreshToken,
    );
    if (userIdOrError.isFailure) {
      this.logger.warn('Invalid refresh token provided');
      return Result.fail('Invalid or expired token');
    }
    const userId = userIdOrError.getValue();

    // 3. Find token in repository
    const refreshTokenOrError = await this.tokenRepository.findByToken(token);
    if (refreshTokenOrError.isFailure) {
      this.logger.warn('Refresh token not found in database', {
        userId: userId.getValue(),
      });
      return Result.fail('Invalid or expired token');
    }
    const refreshToken = refreshTokenOrError.getValue();

    // 4. Check if token is valid
    if (!refreshToken.isValid()) {
      this.logger.warn('Refresh token is invalid', {
        userId: userId.getValue(),
      });
      return Result.fail('Invalid or expired token');
    }

    // 5. Get user
    const userOrError = await this.userRepository.findById(userId);
    if (userOrError.isFailure) {
      this.logger.error(
        'User not found for valid token',
        new Error(userOrError.error),
        { userId: userId.getValue() },
      );
      return Result.fail('User not found');
    }
    const user = userOrError.getValue();

    // 6. Check user status
    if (!user.isActive()) {
      this.logger.warn('Token refresh attempted for inactive user', {
        userId: userId.getValue(),
      });
      return Result.fail('Account has been deactivated');
    }

    // 7. Revoke old token (rotation)
    const revokeResult = refreshToken.revoke();
    if (revokeResult.isSuccess) {
      await this.tokenRepository.update(refreshToken);
    }

    // 8. Generate new tokens
    const tokenPayload: TokenPayload = {
      userId: user.id.getValue(),
      email: user.getEmail().getValue(),
      roles: user.getRoles(),
    };

    const newAccessTokenOrError = await this.tokenGenerator.generateAccessToken(
      user.id,
      tokenPayload,
    );
    if (newAccessTokenOrError.isFailure) {
      this.logger.error('Failed to generate new access token');
      return Result.fail('Unable to refresh token');
    }

    const newRefreshTokenOrError =
      await this.tokenGenerator.generateRefreshToken(user.id);
    if (newRefreshTokenOrError.isFailure) {
      this.logger.error('Failed to generate new refresh token');
      return Result.fail('Unable to refresh token');
    }

    // 9. Log success
    this.logger.info('Token refreshed successfully', {
      userId: user.id.getValue(),
    });

    return Result.ok({
      accessToken: newAccessTokenOrError.getValue(),
      refreshToken: newRefreshTokenOrError.getValue(),
    });
  }
}
