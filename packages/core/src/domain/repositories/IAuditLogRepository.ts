import { AuditLogId } from "../value-objects/AuditLogId";
import { Result } from "../../shared/utils/Result";
import { AuditAction, AuditLog } from "../entities/AuditLog";
import { UserId } from "../value-objects/UserId";

interface AuditLogFilter {
    userId?: UserId;
    action?: AuditAction;
    startDate?: Date;
    endDate?: Date;
    skip?: number;
    take?: number;
}
export interface IAuditLogRepository {
    findById(id: AuditLogId): Promise<Result<AuditLog>>;
    findByUserId(userId: UserId): Promise<Result<AuditLog[]>>;
    findByFilter(filter: AuditLogFilter): Promise<Result<AuditLog[]>>;
    save(auditLog: AuditLog): Promise<Result<void>>;
    update(auditLog: AuditLog): Promise<Result<void>>;
    delete(id: AuditLogId): Promise<Result<void>>;
    deleteOlderThan(date: Date): Promise<Result<number>>;
}