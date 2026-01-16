
export class IPAddress {
  private readonly value: string;

 public constructor(value: string) {
    this.value = value;
  }

  public getValue(): string {
    return this.value;
  }

  public equals(ipAddress: IPAddress): boolean {
    return this.value === ipAddress.value;
  }
}