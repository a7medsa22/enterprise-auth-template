import { Result } from "./Result";


export class PasswordValidator {
  /**
   * Verifies that a raw password satisfies all of the configured constraints.
   *
   * @param password - plain-text password to validate
   * @returns a success result when the password is acceptable; a failure result
   *          containing a human-readable message otherwise.
   */
  static validate(password: string): Result<void> {
    if (password.length < 8) {
      return Result.fail("Password must be at least 8 characters long");
    }

    if (!/[A-Z]/.test(password)) {
      return Result.fail("Password must contain at least one uppercase letter");
    }

    if (!/[a-z]/.test(password)) {
      return Result.fail("Password must contain at least one lowercase letter");
    }

    if (!/[0-9]/.test(password)) {
      return Result.fail("Password must contain at least one numeric digit");
    }

    if (!/[@$!%*?&]/.test(password)) {
      return Result.fail("Password must contain at least one special character");
    }

    if (/\s/.test(password)) {
      return Result.fail("Password must not contain whitespace characters");
    }
    if (/(.)\1\1/.test(password)) {
      return Result.fail("Password must not contain sequences of three or more repeated characters");
    }
    if (/(012|123|234|345|456|567|678|789|890)/.test(password)) {
        return Result.fail("Password must not contain sequences of three or more consecutive numbers");
    }

    // additional rules could be added here (e.g. blacklist, entropy check,

    return Result.ok();
  }
}
