import { v4 as uuid } from 'uuid';

export class AuditLogId{
    private readonly value: string;

    private constructor(id:string){
        this.value = id;
    }

    public static create(id?:string){
        return new AuditLogId(id || uuid() );
    }

    public getValue(): string {
        return this.value;
    }
    
    public toString():string{
        return this.value;
    }

    public equals(auditLogId: AuditLogId): boolean {
        return this.value === auditLogId.value;
    }

}