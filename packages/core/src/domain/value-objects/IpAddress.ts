import { Result } from "../../shared/utils/Result";

export class IPAddress {
  private readonly value: string;
  private readonly version: 'v4' | 'v6';

  private constructor(ip: string, version: 'v4' | 'v6') {
    this.value = ip;
    this.version = version;
  }

  public static create(ip: string): Result<IPAddress> {
    if (!ip || ip.trim().length === 0) {
      return Result.fail('IP address cannot be empty');
    }

    const cleanIp = ip.trim();

    // Check IPv4
    if (this.isValidIPv4(cleanIp)) {
      return Result.ok(new IPAddress(cleanIp, 'v4'));
    }

    // Check IPv6
    if (this.isValidIPv6(cleanIp)) {
      return Result.ok(new IPAddress(cleanIp, 'v6'));
    }

    return Result.fail('Invalid IP address format');
  }

  private static isValidIPv4(ip: string): boolean {
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipv4Regex.test(ip)) return false;

    const parts = ip.split('.');
    return parts.every(part => {
      const num = parseInt(part, 10);
      return num >= 0 && num <= 255;
    });
  }

  private static isValidIPv6(ip: string): boolean {
    const ipv6Regex = /^([0-9a-fA-F]{0,4}:){7}[0-9a-fA-F]{0,4}$/;
    return ipv6Regex.test(ip);
  }

  public getValue(): string {
    return this.value;
  }

  public getVersion(): 'v4' | 'v6' {
    return this.version;
  }

  public equals(ipAddress: IPAddress): boolean {
    return this.value === ipAddress.value;
  }

  public toString(): string {
    return this.value;
  }
}