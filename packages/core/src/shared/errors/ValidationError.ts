import { DomainError } from "./DomainError"

export class ValidationError extends DomainError {
    constructor(message: string, public readonly field?:string) {
        super(message);
    }
}

export class EmailValidationError  extends ValidationError {
    constructor(message: string='Invalid email format') {
        super(message, 'email');
    }
}

export class PasswordValidationError extends ValidationError {
    constructor(message: string) {
        super(message, 'password');
    }
}
