import { User, Role } from '@auth-template/core/domain';
import { UserId } from '@auth-template/core/domain';
import { Email } from '@auth-template/core/domain';
import { Password } from '@auth-template/core/domain';
import { UserEntity } from '../entities/UserEntity';

export class UserMapper {
  public static toDomain(entity: UserEntity): User {
    const emailOrError = Email.create(entity.email);
    if (emailOrError.isFailure) {
      throw new Error(`Invalid email in database: ${entity.email}`);
    }

    const passwordOrError = Password.create({
      value: entity.password,
      hashed: true,
    });
    if (passwordOrError.isFailure) {
      throw new Error(`Invalid password in database`);
    }

    const user = User.restore({
      id: UserId.create(entity.id),
      email: emailOrError.getValue(),
      password: passwordOrError.getValue(),
      roles: entity.roles as Role[],
      isActive: entity.isActive,
      emailVerified: entity.emailVerified,
      lastLoginAt: entity.lastLoginAt || undefined,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });

    return user;
  }

  public static toPersistence(user: User): UserEntity {
    const entity = new UserEntity();
    entity.id = user.id.getValue();
    entity.email = user.getEmail().getValue();
    entity.password = user.getPassword().getValue();
    entity.roles = user.getRoles();
    entity.isActive = user.isActive();
    entity.emailVerified = user.isEmailVerified();
    entity.lastLoginAt = user.getLastLoginAt() || null;
    entity.createdAt = user.getCreatedAt();
    entity.updatedAt = user.getUpdatedAt();
    return entity;
  }
}
