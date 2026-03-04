import { Entity, PrimaryColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('sessions')
@Index(['userId'])
@Index(['userId', 'isActive'])
export class SessionEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column('uuid')
  userId!: string;

  @Column({ type: 'varchar', length: 45 })
  ipAddress!: string;

  @Column({ type: 'text' })
  userAgent!: string;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ type: 'timestamp' })
  expiresAt!: Date;

  @Column({ type: 'timestamp' })
  lastActivityAt!: Date;

  @CreateDateColumn()
  createdAt!: Date;
}
