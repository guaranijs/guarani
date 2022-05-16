import { ISession } from 'connect-typeorm';
import { Column, Entity, Index, PrimaryColumn } from 'typeorm';

@Entity({ name: 'sessions' })
export class Session implements ISession {
  @PrimaryColumn({ type: 'varchar', length: 255 })
  public readonly id!: string;

  @Index()
  @Column({ name: 'expired_at', type: 'bigint' })
  public expiredAt: number = Date.now();

  @Column({ name: 'data', type: 'varchar' })
  public json!: string;
}
