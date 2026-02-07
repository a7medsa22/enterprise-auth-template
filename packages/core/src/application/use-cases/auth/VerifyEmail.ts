import { IUserRepository } from "../../../domain/repositories/IUserRepository";
import { UserId } from "../../../domain/value-objects/UserId";
import { EmailVerifiedEvent, IEventBus } from "../../../shared/events";
import { Result } from "../../../shared/utils/Result";
import { ILogger } from "../../ports";

export interface VerifyEmailDTO {
  userId: string;
  verificationToken: string; // Would be validated by infrastructure layer
}

export interface VerifyEmailResult {
  success: boolean;
  message: string;
}

export class VerifyEmail {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly eventBus: IEventBus,
    private readonly logger: ILogger,
  ) {}

  async execute(dto: VerifyEmailDTO): Promise<Result<VerifyEmailResult>> {
    // 1. Get user
    const userId = UserId.create(dto.userId);
    const userOrError = await this.userRepository.findById(userId);
    
    if (userOrError.isFailure) {
      return Result.fail('User not found');
    }

    const user = userOrError.getValue();

    // 2. Verify email (business rule check inside entity)
    const verifyResult = user.verifyEmail();
    if (verifyResult.isFailure) {
      return Result.fail(verifyResult.error);
    }

    // 3. Update user
    const updateOrError = await this.userRepository.update(user);
    if (updateOrError.isFailure) {
      this.logger.error('Failed to update user after email verification', new Error(updateOrError.error));
      return Result.fail('Unable to verify email');
    }

    // 4. Publish event
    await this.eventBus.publish(new EmailVerifiedEvent(user.id));

    // 5. Log success
    this.logger.info('Email verified successfully', { userId: dto.userId });

    return Result.ok({
      success: true,
      message: 'Email verified successfully',
    });
  }
}