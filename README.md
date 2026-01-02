# Secure Authentication Module (NestJS)

A production-ready, secure, and extensible Authentication Module for NestJS applications. This module implements **JWT Access & Refresh Tokens**, **Refresh Token Rotation**, and **HttpOnly Cookies** to provide "Secure Level" authentication.

## Features

-   **JWT Authentication**: Stateless authentication using Access and Refresh tokens.
-   **Refresh Token Rotation**: Detects token reuse and prevents replay attacks.
-   **Secure Storage**:
    -   Access Tokens: Short-lived (15m).
    -   Refresh Tokens: Long-lived (7d), stored in **HttpOnly, Secure** cookies to prevent XSS.
    -   Server-side: Refresh token whitelist stored in **Redis** for instant revocation.
-   **Modular Architecture**: Decoupled logic using Ports & Adapters pattern (Hexagonal Architecture).
-   **RBAC Ready**: Built-in support for Role-Based Access Control.

## Prerequisites

-   **Node.js** (v18+)
-   **Redis** (Required for token storage)
-   **PostgreSQL** (Or any database supported by TypeORM)

## Installation

1.  **Clone the repository**:
    ```bash
    git clone <repository-url>
    cd auth-template-diy
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Configure Environment**:
    Copy `.env.example` to `.env` and update the values.
    ```bash
    cp .env.example .env
    ```

    **Key Variables:**
    ```env
    # JWT
    JWT_ACCESS_SECRET=your-strong-access-secret
    JWT_REFRESH_SECRET=your-strong-refresh-secret
    JWT_ACCESS_EXPIRATION=15m
    JWT_REFRESH_EXPIRATION=7d

    # Redis
    REDIS_HOST=localhost
    REDIS_PORT=6379
    ```

4.  **Run Redis**:
    Ensure your Redis server is running.
    ```bash
    # Docker example
    docker run -d -p 6379:6379 redis
    ```

## Running the Application

```bash
# development
npm run start

# watch mode
npm run start:dev

# production mode
npm run start:prod
```

## API Endpoints

### Authentication (`/auth`)

| Method | Endpoint         | Description                                                                 | Auth Required |
| :----- | :--------------- | :-------------------------------------------------------------------------- | :------------ |
| `POST` | `/auth/register` | Register a new user.                                                        | No            |
| `POST` | `/auth/login`    | Login with email/password. Returns Access Token & sets Refresh Token Cookie.| No            |
| `POST` | `/auth/refresh`  | Get a new Access Token using the HttpOnly Refresh Token cookie.             | No (Cookie)   |
| `POST` | `/auth/logout`   | Revoke Refresh Token and clear cookies.                                     | Yes           |
| `GET`  | `/auth/me`       | Get current user profile.                                                   | Yes (JWT)     |

### Example Usage

**1. Register**
```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "StrongPassword123!"
}
```

**2. Login**
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "StrongPassword123!"
}
```
*Response:*
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsIn...",
  "user": { ... }
}
```
*Cookies:* `refresh_token=...; HttpOnly; Path=/`

**3. Refresh Token**
```http
POST /auth/refresh
Cookie: refresh_token=...
```
*Response:*
```json
{
  "accessToken": "new_access_token",
  "user": { ... }
}
```

## Architecture

This module follows the **Ports & Adapters (Hexagonal)** architecture to ensure flexibility and testability.

-   **Domain Service** (`AuthDomainService`): Pure business logic (e.g., password validation).
-   **Application Service** (`AuthService`, `TokenService`): Orchestrates the flow (e.g., login, token issuance).
-   **Adapters**:
    -   `RedisTokenStorageAdapter`: Implements `TokenStorage` port using Redis.
    -   `BcryptPasswordAdapter`: Implements `PasswordServicePort` using bcrypt.
    -   `UsersServiceAdapter`: Bridges Auth module to Users module.

## Security Notes

-   **HttpOnly Cookies**: Refresh tokens are not accessible via JavaScript, mitigating XSS risks.
-   **Token Rotation**: Every time a refresh token is used, it is revoked and replaced. If an attacker steals a refresh token and uses it, the legitimate user's next attempt will fail (or trigger an alarm), and the attacker's token will also be invalidated upon next use.
