# ADR 001: Clean Architecture

## Status
Accepted

## Context
We need an authentication system that is:
- Framework independent
- Testable
- Maintainable
- Scalable
- Reusable across different projects

## Decision
We will use Clean Architecture with these layers:
```text
┌─────────────────────────────────────┐
│   Presentation Layer                │
├─────────────────────────────────────┤
│   Infrastructure Layer              │
├─────────────────────────────────────┤
│   Application Layer                 │
├─────────────────────────────────────┤
│   Domain Layer                      │
└─────────────────────────────────────┘
```

### Domain Layer
- Pure business entities
- Value objects
- **Zero external dependencies**

### Application Layer
- Use cases
- Interfaces (Ports)
- Domain services

### Infrastructure Layer
- Database repositories
- Caching
- Email services

### Presentation Layer
- HTTP controllers
- DTOs
- Guards

## Consequences

### Positive
- ✅ Framework independent
- ✅ Easy to test
- ✅ Can swap frameworks
- ✅ Clear separation
- ✅ Reusable

### Negative
- ❌ More setup required
- ❌ Steeper learning curve
- ❌ More files

## Alternatives Considered

### 1. Traditional MVC
**Pros:** Simple
**Cons:** Coupled to framework

### 2. Anemic Domain Model
**Pros:** Simple data
**Cons:** Logic scattered

## References
- Clean Architecture by Robert C. Martin
- Hexagonal Architecture by Alistair Cockburn