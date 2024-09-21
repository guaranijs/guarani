import {
  BaseEntity,
  Check,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { EndSessionRequest, LogoutTicket as OAuth2LogoutTicket } from '@guarani/oauth2-server';
import { mixin } from '@guarani/primitives';

import { Client } from './client.entity';
import { Session } from './session.entity';

@Entity({ name: 'logout_tickets' })
// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
export class LogoutTicket extends mixin(BaseEntity, OAuth2LogoutTicket) {
  @PrimaryGeneratedColumn('uuid', { name: 'id', primaryKeyConstraintName: 'logout_tickets_pk' })
  public readonly id!: string;

  @Column({ name: 'logout_challenge', type: 'varchar', nullable: false, unique: true })
  @Check('check_logout_challenge_length', 'length("logout_challenge") = 32')
  public readonly logoutChallenge!: string;

  @Column({ name: 'parameters', type: 'json', nullable: false })
  public readonly parameters!: EndSessionRequest;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', nullable: false })
  public readonly createdAt!: Date;

  @Column({ name: 'expires_at', type: 'timestamp', nullable: false })
  public readonly expiresAt!: Date;

  @ManyToOne(() => Client, { cascade: false, eager: true, nullable: false, onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'client_id', referencedColumnName: 'id', foreignKeyConstraintName: 'clients_id_fk' })
  public readonly client!: Client;

  @OneToOne(() => Session, { cascade: false, eager: true, nullable: false, onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'session_id', referencedColumnName: 'id', foreignKeyConstraintName: 'sessions_id_fk' })
  public readonly session!: Session;
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
export interface LogoutTicket extends BaseEntity, OAuth2LogoutTicket {}
