import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { UserId } from '../../../domain/value-objects/UserId';
import { EmailVerifiedEvent, IEventBus } from '../../../shared/events';
import { Result } from '../../../shared/utils/Result';
import { ILogger, ITokenGenerator } from '../../ports';

export interface VerifyEmailDTO {
  userId: string;
  verificationToken: string;
}

export interface VerifyEmailResult {
  success: boolean;
  message: string;
}

export class VerifyEmail {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly tokenGenerator: ITokenGenerator,
    private readonly eventBus: IEventBus,
    private readonly logger: ILogger,
  ) {}

  async execute(dto: VerifyEmailDTO): Promise<Result<VerifyEmailResult>> {
    const payloadOrError = await this.tokenGenerator.verifyAccessToken(
      dto.verificationToken,
    );
    if (payloadOrError.isFailure) {
      return Result.fail('Invalid or expired verification token');
    }

    const tokenPayload = payloadOrError.getValue();
    if (tokenPayload.userId !== dto.userId) {
      return Result.fail('Verification token does not match user');
    }

    const userId = UserId.create(dto.userId);
    const userOrError = await this.userRepository.findById(userId);

    if (userOrError.isFailure) {
      return Result.fail('User not found');
    }

    const user = userOrError.getValue();

    const verifyResult = user.verifyEmail();
    if (verifyResult.isFailure) {
      return Result.fail(verifyResult.error);
    }

    const updateOrError = await this.userRepository.update(user);
    if (updateOrError.isFailure) {
      this.logger.error(
        'Failed to update user after email verification',
        new Error(updateOrError.error),
      );
      return Result.fail('Unable to verify email');
    }

    await this.eventBus.publish(new EmailVerifiedEvent(user.id));

    this.logger.info('Email verified successfully', { userId: dto.userId });

    return Result.ok({
      success: true,
      message: 'Email verified successfully',
    });
  }
}
