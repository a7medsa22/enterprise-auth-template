# 🔐 Enterprise Auth Template

> Production-ready authentication system built with Clean Architecture, DDD, and TypeScript. Framework-agnostic core that works with NestJS, Express, Fastify, and more.

[![CI](https://github.com/your-username/auth-template/workflows/Test/badge.svg)](https://github.com/your-username/auth-template/actions)
[![Coverage](https://codecov.io/gh/your-username/auth-template/branch/main/graph/badge.svg)](https://codecov.io/gh/your-username/auth-template)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)

## ✨ Why This Template?

Traditional auth systems couple business logic to frameworks, making them:

- ❌ Hard to test
- ❌ Impossible to reuse
- ❌ Difficult to maintain
- ❌ Framework-locked

This template solves all that:

- ✅ **Framework Agnostic** - Core works with ANY framework
- ✅ **Production Ready** - Used in real-world applications
- ✅ **Fully Tested** - 80%+ test coverage
- ✅ **Enterprise Grade** - Clean Architecture + DDD
- ✅ **Type Safe** - 100% TypeScript with strict mode
- ✅ **Secure** - Industry best practices built-in

## 🚀 Quick Start

```bash
# 1. Clone and install
git clone https://github.com/your-username/auth-template.git
cd auth-template
pnpm install

# 2. Setup environment
cp .env.example .env

# 3. Start infrastructure
docker-compose -f docker/development/docker-compose.yml up -d

# 4. Run application
pnpm run dev

# 5. Test API
curl http://localhost:3000/health
```

## 📦 What's Inside?

```
auth-template/
├── packages/
│   ├── core/              # 🎯 Framework-agnostic business logic
│   │   ├── domain/        # Entities, Value Objects, Repositories
│   │   ├── application/   # Use Cases, Ports, Services
│   │   └── shared/        # Events, Errors, Utilities
│   │
│   ├── typeorm/           # 🗄️ Shared TypeORM persistence layer
│   │   ├── entities/      # User, RefreshToken, Session, AuditLog entities
│   │   ├── repositories/  # Base TypeORM user & token repositories
│   │   └── cache/         # Base Redis & In-Memory caching layers
│   │
│   ├── nestjs-adapter/    # 🔌 NestJS adapter & email queue integration
│   │   ├── infrastructure # Nodemailer, Bull/Redis email queue, Security
│   │   ├── presentation   # Controllers, Guards, Strategies, DTOs
│   │   └── config         # NestJS configuration schemas
│   │
│   ├── express-adapter/   # 🚀 Express.js router & middleware adapter
│   │   ├── middleware     # JWT Auth, Roles Authorization, Zod Validation
│   │   ├── router         # Pre-configured Express auth routes
│   │   └── config         # Environment config loader
│   │
│   └── fastify-adapter/   # ⚡ Fastify adapter (in progress)
│
├── apps/
│   └── demo/              # 🎮 Example application
│
├── docs/                  # 📚 Complete documentation
├── test/                  # 🧪 Integration & E2E tests
└── docker/                # 🐳 Docker configurations
```

## 🌟 Key Features

### Security First

- ✅ JWT with token rotation
- ✅ Bcrypt/Argon2 password hashing
- ✅ Rate limiting & account lockout
- ✅ Email verification & Nodemailer / Bull Redis queue delivery
- ✅ Audit logging for all actions
- ✅ CORS & Helmet protection

### Clean Architecture

- ✅ Zero framework dependencies in core
- ✅ Shared TypeORM persistence layer (`@auth-template/typeorm`)
- ✅ Production-ready adapters for NestJS (`@auth-template/nestjs-adapter`) and Express (`@auth-template/express-adapter`)
- ✅ Easy to test every layer
- ✅ Dependency inversion principle
- ✅ Single responsibility principle

### Developer Experience

- ✅ TypeScript with strict mode (`tsc -b` solution mode build)
- ✅ Result pattern (no exceptions)
- ✅ Comprehensive documentation
- ✅ Docker development environment
- ✅ Hot reload in development
- ✅ ESLint + Prettier configured

### Production Ready

- ✅ Docker multi-stage builds
- ✅ CI/CD with GitHub Actions (PNPM + EC2 PM2 Deployment)
- ✅ Health checks & monitoring
- ✅ Async email processing via Bull & Redis
- ✅ Horizontal scaling ready
- ✅ Database connection pooling (Neon & PostgreSQL)
- ✅ Multi-layer caching (Redis / Upstash Redis / Memory)

## 📖 Documentation

- **[Getting Started](docs/guides/getting-started.md)** - Setup in 5 minutes
- **[Architecture Overview](docs/architecture/README.md)** - How it works
- **[Customization Guide](docs/guides/customization.md)** - Add your features
- **[Deployment Guide](docs/guides/deployment.md)** - Go to production
- **[API Reference](docs/api/openapi.yaml)** - OpenAPI 3.0 spec

### Architecture Decision Records

- [ADR 001: Clean Architecture](docs/architecture/decisions/001-clean-architecture.md)
- [ADR 002: Repository Pattern](docs/architecture/decisions/002-repository-pattern.md)
- [ADR 003: Event-Driven](docs/architecture/decisions/003-event-driven.md)

## 🎯 Usage Examples

### NestJS Adapter (`@auth-template/nestjs-adapter`)

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

```typescript
import express from 'express';
import { createAuthRouter } from '@auth-template/express-adapter';
import { AppDataSource } from './data-source';

const app = express();
app.use(express.json());

const { router, jwtMiddleware, requireRoles } = createAuthRouter({
  dataSource: AppDataSource,
  cacheProvider: 'memory',
});

// Mount authentication endpoints (/register, /login, /refresh, /logout, etc.)
app.use('/auth', router);

// Protected route example using JWT middleware & role checks
app.get('/admin', jwtMiddleware, requireRoles('ADMIN'), (req, res) => {
  res.json({ message: 'Welcome Admin', user: req.user });
});
```

### Protect Routes (NestJS)

```typescript
import { Public, CurrentUser, Roles } from '@auth-template/nestjs-adapter';
import { Role } from '@auth-template/core';

@Controller('products')
export class ProductsController {
  // Public route
  @Public()
  @Get()
  findAll() {
    return this.productsService.findAll();
  }

  // Protected route
  @Get('my')
  findMine(@CurrentUser('userId') userId: string) {
    return this.productsService.findByUser(userId);
  }

  // Role-based route
  @Post()
  @Roles(Role.ADMIN)
  create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }
}
```

### Framework Agnostic Core

```typescript
import { RegisterUserUseCase } from '@auth-template/core';

// Works with ANY framework (Express, Fastify, Koa, etc.)
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

## 🧪 Testing

```bash
# Unit tests
pnpm test

# E2E & Integration tests
pnpm test:e2e

# Coverage
pnpm test:cov

# Watch mode
pnpm test:watch
```

## 🐳 Docker

```bash
# Development
docker-compose -f docker/development/docker-compose.yml up

# Production
docker-compose -f docker/production/docker-compose.prod.yml up -d

# Build
docker build -t auth-template:latest -f docker/Dockerfile .
```

## 📊 Performance

| Operation       | Time  | RPS  |
| --------------- | ----- | ---- |
| Register        | 120ms | 833  |
| Login           | 110ms | 909  |
| Refresh         | 25ms  | 4000 |
| Protected Route | 15ms  | 6666 |

## 🛠️ Tech Stack

- **Core**: TypeScript, UUID
- **Persistence**: TypeORM with PostgreSQL / Neon, shared base layer (`@auth-template/typeorm`)
- **Framework Adapters**: NestJS (`@auth-template/nestjs-adapter`), Express (`@auth-template/express-adapter`)
- **Queue & Async**: Bull Queue with Redis / Upstash Redis
- **Mail**: Nodemailer (direct or queue-processed)
- **Security**: Bcrypt, Argon2, JWT, Zod
- **Testing**: Jest, Supertest
- **DevOps**: Docker, GitHub Actions, PM2, PNPM

## 🤝 Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md).

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 👥 Authors

- **Ahmed Salah** - [@a7medsa22](https://github.com/a7medsa22)

## 🙏 Acknowledgments

- Clean Architecture by Robert C. Martin
- Domain-Driven Design by Eric Evans
- NestJS Framework Team
- All contributors

## 📞 Support

- 📧 Email: ahmedsalahsotoy@gmail.com
- 🐛 Issues: [GitHub Issues](https://github.com/a7medsa22/auth-template/issues)
- 📖 Docs: [Full Documentation](https://docs.example.com)

---

**⭐ If this project helped you, please give it a star!**

**📢 Share with your team and help others build better authentication systems!**
