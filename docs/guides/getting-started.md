# Getting Started Guide

## Prerequisites

Before you begin, ensure you have the following installed:

- Node.js >= 20.0.0
- pnpm >= 8.0.0
- Docker and Docker Compose
- PostgreSQL (or use Docker)
- Redis (or use Docker)

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

# Optional (Docker will use defaults)
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=auth_db
```

### 4. Start Infrastructure with Docker

```bash
docker-compose -f docker/development/docker-compose.yml up -d
```

This starts:

- PostgreSQL database
- Redis cache
- Demo API (optional)

### 5. Run the Application

```bash
# Development mode with hot reload
pnpm run dev

# Or start demo API directly
cd apps/demo-api
pnpm run start:dev
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
│   ├── core/              # Framework-agnostic business logic
│   └── nestjs-adapter/    # NestJS implementation
├── apps/
│   └── demo-api/          # Example application
├── docs/                  # Documentation
├── docker/                # Docker configurations
└── tests/                 # E2E tests
```

## Understanding the Architecture

### Core Package (`@auth-template/core`)

**Location:** `packages/core/`

Contains all business logic with **zero framework dependencies**:

- **Domain Layer**: Entities, Value Objects, Repository Interfaces
- **Application Layer**: Use Cases, Application Services, Ports
- **Shared Layer**: Events, Errors, Utilities
```typescript
// Example: Using a use case
import { RegisterUser } from '@auth-template/core';

const registerUser = new RegisterUser(
  userRepository,
  passwordHasher,
  tokenGenerator,
  emailSender,
  eventBus,
  logger
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

Provides NestJS-specific implementations:
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

## Next Steps

1. **Read the Architecture**: Check `docs/architecture/`
2. **Explore Use Cases**: Look at `packages/core/src/application/use-cases/`
3. **Customize**: Add your own use cases or adapters
4. **Deploy**: See `docs/guides/deployment.md`