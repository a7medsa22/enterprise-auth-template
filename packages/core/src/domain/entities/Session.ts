import { SessionId } from "../value-objects/SessionId";
import { UserId } from "../value-objects/UserId";
import { IPAddress } from '../value-objects/IpAddress';
import { Entity } from "./base/Entity";
import { Result } from "../../shared/utils/Result";



interface SessionProps {
    id: SessionId;
    userId: UserId;
    ipAddress: IPAddress;
    userAgent: string;
    isActive: boolean;
    expiresAt: Date;
    lastActivityAt: Date;
    createdAt: Date;
}

export interface CreateSessionProps {
    userId: UserId;
    ipAddress: IPAddress;
    userAgent: string;
    expiresAt: Date;
}

export class Session extends Entity<SessionId> {
    private readonly userId: UserId;
    private readonly ipAddress: IPAddress;
    private readonly userAgent: string;
    private _isActive: boolean;
    private readonly expiresAt: Date;
    private _lastActivityAt: Date;
    private readonly createdAt: Date;

    private constructor(props: SessionProps) {
        super(props.id);
        this.userId = props.userId;
        this.ipAddress = props.ipAddress;
        this.userAgent = props.userAgent;
        this._isActive = props.isActive;
        this.expiresAt = props.expiresAt;
        this._lastActivityAt = props.lastActivityAt;
        this.createdAt = props.createdAt;
    }

    public static create(props: CreateSessionProps): Result<Session> {
        if (props.expiresAt <= new Date()) {
            return Result.fail('Session expiry must be in the future');
        }

        const session = new Session({
            id: SessionId.create(),
            userId: props.userId,
            ipAddress: props.ipAddress,
            userAgent: props.userAgent, 
            isActive: true,
            expiresAt: props.expiresAt,
            lastActivityAt: new Date(),
            createdAt: new Date(),
        });

        return Result.ok(session);
    }

    public static restore(props: SessionProps): Session {
        return new Session(props);
    }

    public updateActivity(): void {
        this._lastActivityAt = new Date();
    }

    public terminate(): Result<void> {
        if (!this._isActive) {
            return Result.fail('Session is already terminated');
        }
        this._isActive = false;
        return Result.ok();
    }

    public isExpired(): boolean {
        return this.expiresAt <= new Date();
    }

    public isValid(): boolean {
        return this._isActive && !this.isExpired();
    }

    // Getters
    public getUserId(): UserId {
        return this.userId;
    }

    public getIpAddress(): IPAddress {
        return this.ipAddress;
    }

    public getUserAgent(): string {
        return this.userAgent;
    }

    public isActive(): boolean {
        return this._isActive;
    }

    public getExpiresAt(): Date {
        return this.expiresAt;
    }

    public getLastActivityAt(): Date {
        return this._lastActivityAt;
    }

    public getCreatedAt(): Date {
        return this.createdAt;
    }
}
