# ADR 002: Repository Pattern

## Status
Accepted

## Context
We need to abstract data persistence to:
- Decouple from specific database
- Allow swapping ORMs
- Make testing easier
- Follow DDD principles

## Decision
Repository Pattern with:

### 1. Interface in Domain
```typescript
export interface IUserRepository {
  findById(id: UserId): Promise<Result<User>>;
  save(user: User): Promise<Result<void>>;
}
```

### 2. Implementation in Infrastructure
```typescript
@Injectable()
export class TypeOrmUserRepository implements IUserRepository {
  async findById(id: UserId): Promise<Result<User>> {
    // Implementation
  }
}
```

### 3. Mappers
```typescript
export class UserMapper {
  static toDomain(entity: UserEntity): User { }
  static toPersistence(user: User): UserEntity { }
}
```

## Consequences

### Positive
- ✅ Database agnostic
- ✅ Easy to swap ORM
- ✅ Easy to test
- ✅ Clear data flow

### Negative
- ❌ Need mappers
- ❌ Two entity definitions
- ❌ More boilerplate

## Guidelines

### DO:
- Return `Result<T>`
- Use domain entities
- Handle errors gracefully

### DON'T:
- Don't expose ORM entities
- Don't put business logic here

## Alternatives

### 1. Active Record
**Pros:** Less code
**Cons:** Coupled to database

### 2. Direct ORM
**Pros:** Simple
**Cons:** Framework locked

## References
- DDD by Eric Evans
- Enterprise Patterns by Martin Fowler