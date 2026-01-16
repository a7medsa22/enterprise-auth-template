import { v4 as uuid } from 'uuid';

export class UserId {
  private readonly value: string;

  private constructor(id: string) {
    this.value = id;
  }

  public static create(id?: string): UserId {
    return new UserId(id || uuid());
  }

  public getValue(): string {
    return this.value;
  }

  public equals(userId: UserId): boolean {
    return this.value === userId.value;
  }

  public toString():string{
    return this.value;
  }
}