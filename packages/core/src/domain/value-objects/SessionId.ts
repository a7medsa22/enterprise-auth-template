import { v4 as uuid } from 'uuid';

export class SessionId {
    private readonly value: string;

    public constructor(value: string) {
        this.value = value;
    }

    public static create(id?: string): SessionId {
        return new SessionId(id || uuid());
    }
    public getValue(): string {
        return this.value;
    }

    public equals(sessionId: SessionId): boolean {
        return this.value === sessionId.value;
    }
}