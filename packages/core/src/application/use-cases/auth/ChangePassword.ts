import { Result } from '../../../shared/utils/Result';
import { UserId } from '../../../domain/value-objects/UserId';
import { Password } from '../../../domain/value-objects/Password';
import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { IPasswordHasher } from '../../ports/IpasswordHasher';
import { IEventBus } from '../../../shared/events/DomainEvent';
import { PasswordChangedEvent } from '../../../shared/events/PasswordChanged';
import { ILogger } from '../../ports/ILogger';

export interface ChangePasswordDTO {
    userId: string;
    currentPassword: string;
    newPassword: string;
}

export interface ChangePasswordResult {
    success: boolean;
    message: string;
}

export class ChangePassword {
    constructor(
        private readonly userRepository: IUserRepository,
        private readonly passwordHasher: IPasswordHasher,
        private readonly eventBus: IEventBus,
        private readonly logger: ILogger,
    ) { }

    async execute(dto: ChangePasswordDTO): Promise<Result<ChangePasswordResult>> {
        // 1. Get user
        const userId = UserId.create(dto.userId);
        const userOrError = await this.userRepository.findById(userId);

        if (userOrError.isFailure) {
            return Result.fail('User not found');
        }
        const user = userOrError.getValue();

        // 2. Verify current password
        const isValidOrError = await this.passwordHasher.compare(
            dto.currentPassword,
            user.getPassword().getValue(),
        );

        if (isValidOrError.isFailure || !isValidOrError.getValue()) {
            this.logger.warn('Invalid current password during password change', { userId: dto.userId });
            return Result.fail('Current password is incorrect');
        }

        // 3. Validate new password
        const validationResult = this.passwordHasher.validate(dto.newPassword);
        if (validationResult.isFailure) {
            return Result.fail(validationResult.error);
        }

        // 4. Check new password is different
        const isSameOrError = await this.passwordHasher.compare(
            dto.newPassword,
            user.getPassword().getValue(),
        );

        if (isSameOrError.isSuccess && isSameOrError.getValue()) {
            return Result.fail('New password must be different from current password');
        }

        // 5. Hash new password
        const hashedOrError = await this.passwordHasher.hash(dto.newPassword);
        if (hashedOrError.isFailure) {
            this.logger.error('Failed to hash new password', new Error(hashedOrError.error));
            return Result.fail('Unable to change password');
        }

        const newPasswordOrError = Password.create({
            value: hashedOrError.getValue(),
            hashed: true,
        });

        if (newPasswordOrError.isFailure) {
            return Result.fail(newPasswordOrError.error);
        }

        // 6. Update password (business logic in entity)
        const changeResult = user.changePassword(newPasswordOrError.getValue());
        if (changeResult.isFailure) {
            return Result.fail(changeResult.error);
        }

        // 7. Save user
        const updateOrError = await this.userRepository.update(user);
        if (updateOrError.isFailure) {
            this.logger.error('Failed to update user after password change', new Error(updateOrError.error));
            return Result.fail('Unable to change password');
        }

        // 8. Publish event
        await this.eventBus.publish(new PasswordChangedEvent(user.id));

        // 9. Log success
        this.logger.info('Password changed successfully', { userId: dto.userId });

        return Result.ok({
            success: true,
            message: 'Password changed successfully',
        });
    }
}
