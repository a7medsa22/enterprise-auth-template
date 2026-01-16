import { Result } from "../../shared/utils/Result";

export interface PasswordProps {
  value: string;
  hashed: boolean;
}

export class Password {
  private readonly value: string;
  private readonly hashed: boolean;

  private constructor(props: PasswordProps) {
    this.value = props.value;
    this.hashed = props.hashed;
  }

  public static create(props: PasswordProps): Result<Password> {
    if (!props.hashed) {
      // Validate raw password
      if (props.value.length < 8) {
        return Result.fail('Password must be at least 8 characters');
      }
      if (!/[A-Z]/.test(props.value)) {
        return Result.fail('Password must contain uppercase letter');
      }
      if (!/[a-z]/.test(props.value)) {
        return Result.fail('Password must contain lowercase letter');
      }
      if (!/\d/.test(props.value)) {
        return Result.fail('Password must contain number');
      }
      if (!/[@$!%*?&]/.test(props.value)) {
        return Result.fail('Password must contain special character');
      }
    }

    return Result.ok(new Password(props));
  }

  public getValue(): string {
    return this.value;
  }

  public isHashed(): boolean {
    return this.hashed;
  }

  public equals(password: Password): boolean {
    return this.value === password.value;
  }
}