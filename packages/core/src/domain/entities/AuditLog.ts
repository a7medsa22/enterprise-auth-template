import { Entity } from './base/Entity';
import { AuditLogId } from '../value-objects/AuditLogId';
import { UserId } from '../value-objects/UserId';
import { Result } from '../../shared/utils/Result';
import { IPAddress } from '../value-objects/IpAddress';

export enum AuditAction {
  USER_REGISTERED = 'USER_REGISTERED',
  USER_LOGIN_SUCCESS = 'USER_LOGIN_SUCCESS',
  USER_LOGIN_FAILED = 'USER_LOGIN_FAILED',
  USER_LOGOUT = 'USER_LOGOUT',
  PASSWORD_CHANGED = 'PASSWORD_CHANGED',
  EMAIL_VERIFIED = 'EMAIL_VERIFIED',
  TOKEN_REFRESHED = 'TOKEN_REFRESHED',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  ACCOUNT_UNLOCKED = 'ACCOUNT_UNLOCKED',
  ROLE_ADDED = 'ROLE_ADDED',
  ROLE_REMOVED = 'ROLE_REMOVED',
  OAUTH_LINKED = 'OAUTH_LINKED',
  OAUTH_UNLINKED = 'OAUTH_UNLINKED',
}

interface AuditLogProps {
  id: AuditLogId;
  userId: UserId;
  action: AuditAction;
  ipAddress: IPAddress;
  userAgent: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export interface CreateAuditLogProps {
  userId: UserId;
  action: AuditAction;
  ipAddress: IPAddress;
  userAgent: string;
  metadata?: Record<string, any>;
}

export class AuditLog extends Entity<AuditLogId> {
  private readonly userId: UserId;
  private readonly action: AuditAction;
  private readonly ipAddress: IPAddress;
  private readonly userAgent: string;
  private readonly metadata?: Record<string, any>;
  private readonly createdAt: Date;

  private constructor(props: AuditLogProps) {
    super(props.id);
    this.userId = props.userId;
    this.action = props.action;
    this.ipAddress = props.ipAddress;
    this.userAgent = props.userAgent;
    this.metadata = props.metadata;
    this.createdAt = props.createdAt;
  }

  public static create(props: CreateAuditLogProps): Result<AuditLog> {
    const auditLog = new AuditLog({
      id: AuditLogId.create(),
      userId: props.userId,
      action: props.action,
      ipAddress: props.ipAddress,
      userAgent: props.userAgent,
      metadata: props.metadata,
      createdAt: new Date(),
    });

    return Result.ok(auditLog);
  }

  public static restore(props: AuditLogProps): AuditLog {
    return new AuditLog(props);
  }

  // Getters
  public getUserId(): UserId {
    return this.userId;
  }

  public getAction(): AuditAction {
    return this.action;
  }

  public getIpAddress(): IPAddress {
    return this.ipAddress;
  }

  public getUserAgent(): string {
    return this.userAgent;
  }

  public getMetadata(): Record<string, any> | undefined {
    return this.metadata;
  }

  public getCreatedAt(): Date {
    return this.createdAt;
  }
}