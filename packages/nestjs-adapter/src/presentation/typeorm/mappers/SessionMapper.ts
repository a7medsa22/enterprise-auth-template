import { Session } from '@auth-template/core/domain/entities/Session';
import { SessionId } from '@auth-template/core/domain/value-objects/SessionId';
import { UserId } from '@auth-template/core/domain/value-objects/UserId';
import { IPAddress } from '@auth-template/core/domain/value-objects/IpAddress';
import { SessionEntity } from '../entities/SessionEntity';

export class SessionMapper {
  public static toDomain(entity: SessionEntity): Session {
    const ipAddressOrError = IPAddress.create(entity.ipAddress);
    if (ipAddressOrError.isFailure) {
      throw new Error(`Invalid IP address in database: ${entity.ipAddress}`);
    }

    const session = Session.restore({
      id: SessionId.create(entity.id),
      userId: UserId.create(entity.userId),
      ipAddress: ipAddressOrError.getValue(),
      userAgent: entity.userAgent,
      isActive: entity.isActive,
      expiresAt: entity.expiresAt,
      lastActivityAt: entity.lastActivityAt,
      createdAt: entity.createdAt,
    });

    return session;
  }

  public static toPersistence(session: Session): SessionEntity {
    const entity = new SessionEntity();
    entity.id = session.id.getValue();
    entity.userId = session.getUserId().getValue();
    entity.ipAddress = session.getIpAddress().getValue();
    entity.userAgent = session.getUserAgent();
    entity.isActive = session.isActive();
    entity.expiresAt = session.getExpiresAt();
    entity.lastActivityAt = session.getLastActivityAt();
    entity.createdAt = session.getCreatedAt();
    return entity;
  }
}
