import { DomainError } from "./DomainError";

export class AuthenticationError extends DomainError {
    constructor(message: string = 'Authentication error') {
        super(message);
    }
}

export class InvalidCredentialsError extends AuthenticationError {
    constructor() {
        super('Invalid credentials');
    }
}

export class AccountLockedError extends AuthenticationError {
  constructor(public readonly unlockAt: Date) {
    super('Account is temporarily locked');
  }
}

export class EmailNotVerifiedError extends AuthenticationError {
  constructor() {
    super('Email address has not been verified');
  }
}

export class AccountInactiveError extends AuthenticationError {
  constructor() {
    super('Account has been deactivated');
  }
}

export class TokenExpiredError extends AuthenticationError {
  constructor() {
    super('Token has expired');
  }
}

export class TokenRevokedError extends AuthenticationError {
  constructor() {
    super('Token has been revoked');
  }
}

export class InvalidTokenError extends AuthenticationError {
  constructor() {
    super('Invalid token');
  }
}
