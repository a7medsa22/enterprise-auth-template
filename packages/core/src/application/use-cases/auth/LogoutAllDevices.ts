import { Result } from '../../../shared/utils/Result';
import { UserId } from '../../../domain/value-objects/UserId';
import { ITokenRepository } from '../../../domain/repositories/ITokenRepository';
import { ILogger } from '../../ports/ILogger';

export interface LogoutAllDevicesDTO {
  userId: string;
}

export class LogoutAllDevices {
  constructor(
    private readonly tokenRepository: ITokenRepository,
    private readonly logger: ILogger,
  ) {}

  async execute(dto: LogoutAllDevicesDTO): Promise<Result<void>> {
    const userId = UserId.create(dto.userId);

    // Delete all refresh tokens for user
    const deleteOrError = await this.tokenRepository.deleteByUserId(userId);
    if (deleteOrError.isFailure) {
      this.logger.error('Failed to delete all refresh tokens', new Error(deleteOrError.error));
      return Result.fail('Unable to logout from all devices');
    }

    this.logger.info('User logged out from all devices', { userId: dto.userId });
    return Result.ok();
  }
}
