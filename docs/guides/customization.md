# Customization Guide

## Adding a New Use Case

### Step 1: Create the Use Case in `@auth-template/core`

```typescript
// packages/core/src/application/use-cases/auth/ResetPassword.ts

import { Email, Password, Result, IUserRepository, IPasswordHasher } from '@auth-template/core';

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
    const userOrError = await this.userRepository.findByEmail(emailOrError.getValue());
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

### Step 2: Register in NestJS Module (`AuthModule.ts`)

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

### Step 3: Create Controller Endpoint (NestJS)

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

---

## Extending the Shared Persistence Layer (`@auth-template/typeorm`)

All database persistence rules are unified in `@auth-template/typeorm` to avoid code duplication across framework adapters.

### Extending `BaseTypeOrmUserRepository`

If you need custom database methods for users (e.g. `findByPhoneNumber`):

```typescript
// Custom repository implementation extending the shared base
import { BaseTypeOrmUserRepository, UserEntity, UserMapper } from '@auth-template/typeorm';
import { Result, User } from '@auth-template/core';

export class CustomUserRepository extends BaseTypeOrmUserRepository {
  async findByPhoneNumber(phone: string): Promise<Result<User>> {
    try {
      const entity = await this.ormRepository.findOne({ where: { phone } as any });
      if (!entity) return Result.fail('User not found');
      return Result.ok(UserMapper.toDomain(entity));
    } catch (error) {
      return Result.fail(`Database query error: ${error}`);
    }
  }
}
```

---

## Using & Customizing the Express Adapter (`@auth-template/express-adapter`)

The `@auth-template/express-adapter` package provides a ready-to-use Express router factory `createAuthRouter()` and middleware utilities.

### Basic Setup

```typescript
import express from 'express';
import { createAuthRouter } from '@auth-template/express-adapter';
import { AppDataSource } from './data-source';

const app = express();
app.use(express.json());

const { router, jwtMiddleware, requireRoles, useCases } = createAuthRouter({
  dataSource: AppDataSource,
  cacheProvider: 'redis',
  redisClient: redisClientInstance,
  config: {
    jwt: {
      accessSecret: process.env.JWT_ACCESS_SECRET!,
      accessExpiration: '15m',
    },
  },
});

// Mount default auth routes
app.use('/auth', router);

// Use returned JWT middleware on protected routes
app.get('/api/profile', jwtMiddleware, (req, res) => {
  res.json({ user: req.user });
});

// Use role checking middleware
app.get('/api/admin', jwtMiddleware, requireRoles('ADMIN'), (req, res) => {
  res.json({ message: 'Admin access granted' });
});
```

---

## Creating a Custom Framework Adapter (e.g., Fastify / Koa)

To build an adapter for a new web framework:

1. Import entities and base repositories from `@auth-template/typeorm`.
2. Import domain use cases from `@auth-template/core`.
3. Wrap use case execution into framework-native route handlers.

```typescript
// Example: Fastify route handler
import { RegisterUserUseCase } from '@auth-template/core';
import { FastifyInstance } from 'fastify';

export async function registerAuthRoutes(fastify: FastifyInstance, opts: { registerUser: RegisterUserUseCase }) {
  fastify.post('/auth/register', async (request, reply) => {
    const result = await opts.registerUser.execute(request.body as any);
    if (result.isFailure) {
      return reply.status(400).send({ message: result.error });
    }
    return reply.status(201).send(result.getValue());
  });
}
```

---

## Environment Configuration

### Development

```env
NODE_ENV=development
JWT_ACCESS_EXPIRATION=15m
BCRYPT_ROUNDS=10
SMTP_HOST=localhost
SMTP_PORT=1025
```

### Production

```env
NODE_ENV=production
JWT_ACCESS_EXPIRATION=5m
BCRYPT_ROUNDS=12
DATABASE_URL=postgresql://user:pass@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require
REDIS_URL=rediss://default:pass@endpoint.upstash.com:6379
```

