import { Result } from "../../shared/utils/Result";

export class IPAddress {
  private readonly value: string;

 public constructor(value: string) {
    this.value = value;
  }

  public static create(value: string): Result<IPAddress> {
    if (!this.validate(value)) {
      return Result.fail(`Invalid IP address: ${value}`);
    }
    return Result.ok(new IPAddress(value));
  }
  public getValue(): string {
    return this.value;
  }
  
  public equals(ipAddress: IPAddress): boolean {
    return this.value === ipAddress.value;
  }
  private static validate(value: string): boolean {
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    return ipRegex.test(value);
  }
}