import { SessionId } from "../value-objects/SessionId";

import { Result } from "../../shared/utils/Result";

import { Session } from "inspector";

import { UserId } from "../value-objects/UserId";

export interface ISessionRepository {
    findById(id: SessionId): Promise<Result<Session>>;
    findByUserId(userId: UserId): Promise<Result<Session[]>>;
    findActiveByUserId(userId: UserId): Promise<Result<Session[]>>;
    save(session: Session): Promise<Result<void>>;
    update(session: Session): Promise<Result<Session>>;
    delete(id: SessionId): Promise<Result<void>>;
    deleteByUserId(userId: UserId): Promise<Result<void>>;
    deleteByExpiry(): Promise<Result<void>>;
}