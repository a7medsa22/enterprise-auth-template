# 🗄️ @auth-template/typeorm

> Shared TypeORM persistence layer for enterprise auth-template framework adapters (`@auth-template/nestjs-adapter`, `@auth-template/express-adapter`).

This package extracts shared database entities, mappers, base repositories, and caching strategies to maintain strict DRY principles across all web framework adapters.

## 📦 Installation

```bash
pnpm add @auth-template/typeorm @auth-template/core typeorm ioredis
```

## 🛠️ Exports

### Entities

| Export | TypeORM Table | Domain Entity Mapped |
|---|---|---|
| `UserEntity` | `users` | `User` |
| `RefreshTokenEntity` | `refresh_tokens` | `RefreshToken` |
| `SessionEntity` | `sessions` | `Session` |
| `AuditLogEntity` | `audit_logs` | `AuditLog` |

### Mappers

| Export | Purpose |
|---|---|
| `UserMapper` | Converts between `User` domain entity and `UserEntity` |
| `RefreshTokenMapper` | Converts between `RefreshToken` domain entity and `RefreshTokenEntity` |
| `SessionMapper` | Converts between `Session` domain entity and `SessionEntity` |

### Base Repositories

| Export | Implements Port | Description |
|---|---|---|
| `BaseTypeOrmUserRepository` | `IUserRepository` | Shared TypeORM persistence logic for users (CRUD, find by email, update password, verify email) |
| `BaseTypeOrmTokenRepository` | `ITokenRepository` | Shared TypeORM persistence logic for refresh tokens (save, find, revoke, revoke user tokens) |

### Base Caching Providers

| Export | Description |
|---|---|
| `BaseMemoryCache` | Framework-agnostic in-memory TTL caching layer |
| `BaseRedisCache` | Framework-agnostic Redis caching layer wrapping `ioredis` |

---

## ⚡ Extension Example

Framework adapters extend these base implementations to add framework-specific dependency injection decorators (e.g. NestJS `@Injectable()`) or custom queries.

```typescript
import { BaseTypeOrmUserRepository, UserEntity } from '@auth-template/typeorm';
import { Repository } from 'typeorm';

export class TypeOrmUserRepository extends BaseTypeOrmUserRepository {
  constructor(repository: Repository<UserEntity>) {
    super(repository);
  }

  // Custom queries can be added here
}
```

## 📄 License

MIT © Ahmed Salah
