# Getting Started Guide

## Prerequisites

Before you begin, ensure you have the following installed:

- Node.js >= 24.0.0 (or Node.js >= 20.0.0)
- pnpm >= 8.0.0
- Docker and Docker Compose
- PostgreSQL or Neon Database (or use Docker)
- Redis or Upstash Redis (or use Docker)

## Quick Start (5 minutes)

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/auth-template.git
cd auth-template
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Setup Environment

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Required changes
JWT_ACCESS_SECRET=change-me-to-random-string
JWT_REFRESH_SECRET=change-me-to-another-random-string

# Database Configuration (PostgreSQL / Neon)
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=auth_db

# Redis / Cache Configuration
REDIS_HOST=localhost
REDIS_PORT=6379

# SMTP Email Configuration
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_USER=
SMTP_PASS=
SMTP_SECURE=false
SMTP_FROM="Auth Template <noreply@example.com>"
```

### 4. Start Infrastructure with Docker

```bash
docker-compose -f docker/development/docker-compose.yml up -d
```

This starts:

- PostgreSQL database
- Redis cache
- Demo API

### 5. Run the Application

```bash
# Development mode with hot reload across all monorepo workspaces
pnpm run dev

# Or start demo API directly
cd apps/demo
pnpm run dev
```

### 6. Test the API

Open your browser or use curl:

```bash
# Health check
curl http://localhost:3000/health

# Register a user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test@1234"
  }'
```

## Project Structure

```text
auth-template/
├── packages/
│   ├── core/              # Framework-agnostic business logic & use cases
│   ├── typeorm/           # Shared TypeORM entities & base repositories
│   ├── nestjs-adapter/    # NestJS module, guards, & Bull/Redis email queue
│   ├── express-adapter/   # Express.js router, middlewares, & Zod validation
│   └── fastify-adapter/   # Fastify adapter (in progress)
├── apps/
│   └── demo/              # Example NestJS & Express demo application
├── docs/                  # Architectural documentation & guides
├── docker/                # Docker development & production compose files
└── test/                  # E2E & integration test suites
```

## Understanding the Framework Adapters

### Core Package (`@auth-template/core`)

**Location:** `packages/core/`

Contains all business logic with **zero framework dependencies**:

- **Domain Layer**: Entities (`User`, `RefreshToken`), Value Objects (`Email`, `Password`)
- **Application Layer**: Use Cases (`RegisterUserUseCase`, `LoginUser`, `RefreshTokenUseCase`)
- **Ports**: Interfaces for repositories, password hashers, token generators, email senders

```typescript
import { RegisterUserUseCase } from '@auth-template/core';

const registerUser = new RegisterUserUseCase(
  userRepository,
  emailSender,
  passwordHasher,
  tokenGenerator,
  logger,
  eventBus,
);

const result = await registerUser.execute({
  email: 'user@example.com',
  password: 'SecurePass@123',
});

if (result.isSuccess) {
  const { userId, accessToken } = result.getValue();
}
```

### NestJS Adapter (`@auth-template/nestjs-adapter`)

**Location:** `packages/nestjs-adapter/`

Provides a NestJS dynamic module with optional Redis/Upstash caching and Bull queue async email delivery:

```typescript
import { AuthModule } from '@auth-template/nestjs-adapter';

@Module({
  imports: [
    AuthModule.forRoot({
      cacheProvider: 'redis',
      redisClient: new Redis(),
    }),
  ],
})
export class AppModule {}
```

### Express Adapter (`@auth-template/express-adapter`)

**Location:** `packages/express-adapter/`

Provides a lightweight factory `createAuthRouter()` for Express applications:

```typescript
import express from 'express';
import { createAuthRouter } from '@auth-template/express-adapter';

const app = express();
app.use(express.json());

const { router, jwtMiddleware, requireRoles } = createAuthRouter({
  dataSource: AppDataSource,
  cacheProvider: 'memory',
});

app.use('/api/auth', router);
```

## Next Steps

1. **Read the Architecture**: Check `docs/architecture/README.md`
2. **Explore Use Cases**: Look at `packages/core/src/application/use-cases/`
3. **Customize**: Add your own use cases or adapters (see `docs/guides/customization.md`)
4. **Deploy**: See `docs/guides/deployment.md`

