import { Entity, PrimaryColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('audit_logs')
@Index(['userId'])
@Index(['action'])
@Index(['createdAt'])
export class AuditLogEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column('uuid')
  userId!: string;

  @Column({ type: 'varchar', length: 50 })
  action!: string;

  @Column({ type: 'varchar', length: 45 })
  ipAddress!: string;

  @Column({ type: 'text' })
  userAgent!: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata!: Record<string, any> | null;

  @CreateDateColumn()
  createdAt!: Date;
}
