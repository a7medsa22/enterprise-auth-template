# Architecture Overview

## Introduction

This system uses Clean Architecture principles, ensuring business logic independence from frameworks and external services.

## Core Principles

### 1. Dependency Rule

Dependencies point inward:

```text
 Domain ← Application ← Infrastructure ← Presentation
```

### 2. Framework Independence

Core has zero framework dependencies. You can:
- Switch from NestJS to Express
- Change from TypeORM to Prisma
- Replace Redis with Memcached

### 3. Testability

Every layer tested independently:
- Domain: Pure unit tests
- Application: Mock repositories
- Infrastructure: Integration tests
- Presentation: E2E tests

## Layer Details

### Domain Layer
**Location:** `packages/core/src/domain/`

Contains:
- Entities (User, Session)
- Value Objects (Email, Password)
- Repository Interfaces

Rules:
- No framework dependencies
- Pure TypeScript
- All business rules here

### Application Layer
**Location:** `packages/core/src/application/`

Contains:
- Use Cases (RegisterUser, LoginUser)
- Port Interfaces

Rules:
- Orchestrates domain objects
- Depends only on domain
- Defines interfaces for infrastructure

### Infrastructure Layer
**Location:** `packages/nestjs-adapter/src/infrastructure/`

Contains:
- TypeORM Repositories
- Security implementations
- Cache providers

### Presentation Layer
**Location:** `packages/nestjs-adapter/src/presentation/`

Contains:
- HTTP Controllers
- Guards & Strategies
- DTOs

## Design Patterns

1. Repository Pattern
2. Dependency Injection
3. Result Pattern
4. Value Objects
5. Domain Events
6. Use Case Pattern
7. Adapter Pattern

## References

- [ADR 001: Clean Architecture](decisions/001-clean-architecture.md)
- [ADR 002: Repository Pattern](decisions/002-repository-pattern.md)
- [ADR 003: Event-Driven](decisions/003-event-driven.md)