# Customization Guide

## Adding a New Use Case

### Step 1: Create the Use Case
```typescript
// packages/core/src/application/use-cases/auth/ResetPassword.ts

export interface ResetPasswordDTO {
  email: string;
  token: string;
  newPassword: string;
}

export class ResetPassword {
  constructor(
    private userRepository: IUserRepository,
    private passwordHasher: IPasswordHasher,
  ) {}

  async execute(dto: ResetPasswordDTO): Promise<Result<void>> {
    // 1. Validate email
    const emailOrError = Email.create(dto.email);
    if (emailOrError.isFailure) {
      return Result.fail(emailOrError.error);
    }

    // 2. Get user
    const userOrError = await this.userRepository.findByEmail(
      emailOrError.getValue()
    );
    if (userOrError.isFailure) {
      return Result.fail('User not found');
    }

    // 3. Hash new password
    const hashedOrError = await this.passwordHasher.hash(dto.newPassword);
    if (hashedOrError.isFailure) {
      return Result.fail('Unable to reset password');
    }

    const newPasswordOrError = Password.create({
      value: hashedOrError.getValue(),
      hashed: true,
    });

    // 4. Update password
    const user = userOrError.getValue();
    const changeResult = user.changePassword(newPasswordOrError.getValue());
    if (changeResult.isFailure) {
      return Result.fail(changeResult.error);
    }

    // 5. Save user
    await this.userRepository.update(user);

    return Result.ok();
  }
}
```

### Step 2: Add to Module
```typescript
providers: [
  {
    provide: ResetPassword,
    useFactory: (userRepo, passwordHasher) => 
      new ResetPassword(userRepo, passwordHasher),
    inject: ['IUserRepository', 'IPasswordHasher'],
  },
],
```

### Step 3: Create Controller Endpoint
```typescript
@Public()
@Post('reset-password')
async resetPassword(@Body() dto: ResetPasswordRequest) {
  const result = await this.resetPassword.execute(dto);
  if (result.isFailure) {
    throw new BadRequestException(result.error);
  }
  return { message: 'Password reset successfully' };
}
```

## Adding a New Repository

### Step 1: Define Interface
```typescript
// packages/core/src/domain/repositories/INotificationRepository.ts
export interface INotificationRepository {
  save(notification: Notification): Promise<Result<void>>;
  findByUserId(userId: UserId): Promise<Result<Notification[]>>;
}
```

### Step 2: Implement
```typescript
@Injectable()
export class TypeOrmNotificationRepository implements INotificationRepository {
  async save(notification: Notification): Promise<Result<void>> {
    try {
      const entity = NotificationMapper.toPersistence(notification);
      await this.repository.save(entity);
      return Result.ok();
    } catch (error) {
      return Result.fail(`Failed to save: ${error.message}`);
    }
  }
}
```

### Step 3: Register
```typescript
providers: [
  {
    provide: 'INotificationRepository',
    useClass: TypeOrmNotificationRepository,
  },
],
```

## Adding a New Framework Adapter
```text
packages/express-adapter/
├── src/
│   ├── infrastructure/
│   │   └── (same as NestJS)
│   ├── presentation/
│   │   ├── routes/
│   │   │   └── auth.routes.ts
│   │   ├── middlewares/
│   │   │   ├── auth.middleware.ts
│   │   │   └── roles.middleware.ts
│   │   └── controllers/
│   │       └── auth.controller.ts
│   └── index.ts
└── package.json
```

```typescript
// packages/express-adapter/src/presentation/routes/auth.routes.ts

import { Router } from 'express';
import { RegisterUser } from '@auth-template/core';

export function createAuthRouter(dependencies) {
  const router = Router();
  
  router.post('/register', async (req, res) => {
    const registerUser = new RegisterUser(
      dependencies.userRepository,
      dependencies.passwordHasher,
      dependencies.tokenGenerator,
      dependencies.emailSender,
      dependencies.eventBus,
      dependencies.logger,
    );

    const result = await registerUser.execute(req.body);

    if (result.isFailure) {
      return res.status(400).json({ error: result.error });
    }

    res.status(201).json(result.getValue());
  });

  return router;
}
```


## Environment Configuration

### Development
```env
NODE_ENV=development
JWT_ACCESS_EXPIRATION=15m
BCRYPT_ROUNDS=10
```

### Production
```env
NODE_ENV=production
JWT_ACCESS_EXPIRATION=5m
BCRYPT_ROUNDS=12
```