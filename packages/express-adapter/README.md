# 🚀 @auth-template/express-adapter

> Production-ready Express.js adapter for `@auth-template/core` and `@auth-template/typeorm`.

`@auth-template/express-adapter` connects clean-architecture enterprise authentication logic directly to Express.js applications with zero boilerplate.

## 📦 Installation

```bash
pnpm add @auth-template/express-adapter @auth-template/core @auth-template/typeorm typeorm express
```

## ⚡ Quick Start

```typescript
import express from 'express';
import { DataSource } from 'typeorm';
import { createAuthRouter } from '@auth-template/express-adapter';

// 1. Initialize your TypeORM DataSource
const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  synchronize: false,
  entities: ['node_modules/@auth-template/typeorm/dist/entities/*.js'],
});

await AppDataSource.initialize();

// 2. Initialize Express App & Auth Router
const app = express();
app.use(express.json());

const { router, jwtMiddleware, requireRoles } = createAuthRouter({
  dataSource: AppDataSource,
  cacheProvider: 'memory', // or 'redis' with redisClient
});

// 3. Mount Authentication Routes (/register, /login, /refresh, /logout, etc.)
app.use('/auth', router);

// 4. Protect your Express API routes
app.get('/api/profile', jwtMiddleware, (req, res) => {
  res.json({ message: 'Authenticated', user: req.user });
});

app.get('/api/admin', jwtMiddleware, requireRoles('ADMIN'), (req, res) => {
  res.json({ message: 'Admin Area' });
});

app.listen(3000, () => console.log('Server running on port 3000'));
```

## 🛠️ API Reference

### `createAuthRouter(options: ExpressAuthOptions)`

Factory function that instantiates all underlying domain use cases, repositories, security providers, and Express route handlers.

#### Options

| Option | Type | Required | Description |
|---|---|---|---|
| `dataSource` | `DataSource` | **Yes** | Initialized TypeORM DataSource |
| `config` | `Partial<AuthConfig>` | No | Overrides for JWT, Bcrypt, and SMTP settings |
| `cacheProvider` | `'redis' \| 'memory'` | No | Cache provider (default: `'memory'`) |
| `redisClient` | `Redis` | If `redis` | Pre-configured `ioredis` client instance |

#### Returns

| Return Property | Description |
|---|---|
| `router` | Configured `express.Router` instance with endpoints |
| `jwtMiddleware` | Express RequestHandler checking `Authorization: Bearer <token>` |
| `requireRoles(...roles)` | Middleware factory for role-based access control |
| `useCases` | Domain use cases (`registerUser`, `loginUser`, `refreshToken`, etc.) |
| `repositories` | `userRepository` and `tokenRepository` instances |
| `services` | `passwordHasher`, `tokenGenerator`, `cache`, `emailSender` |

---

## 🔒 Mounted Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/auth/register` | Public | Register new user |
| `POST` | `/auth/login` | Public | Authenticate user & issue tokens |
| `POST` | `/auth/refresh` | Public | Refresh access token using refresh token |
| `POST` | `/auth/verify-email` | Public | Verify email address using token |
| `POST` | `/auth/logout` | JWT | Invalidate refresh token |
| `POST` | `/auth/logout-all` | JWT | Invalidate all refresh tokens for user |
| `POST` | `/auth/change-password` | JWT | Change user password |
| `GET` | `/auth/me` | JWT | Return current authenticated user profile |

---

## ⚙️ Environment Variables

The configuration automatically reads from `process.env`:

```env
JWT_ACCESS_SECRET=your-access-secret
JWT_REFRESH_SECRET=your-refresh-secret
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d
BCRYPT_ROUNDS=10
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=smtp-username
SMTP_PASS=smtp-password
SMTP_SECURE=false
SMTP_FROM="Auth App <noreply@example.com>"
FRONTEND_URL=http://localhost:3000
```

## 📄 License

MIT © Ahmed Salah
