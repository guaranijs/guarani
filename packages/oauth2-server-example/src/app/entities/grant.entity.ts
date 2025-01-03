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
  Unique,
} from 'typeorm';

import { AuthorizationRequest, Grant as OAuth2Grant, InteractionType } from '@guarani/oauth2-server';
import { mixin } from '@guarani/primitives';
import { Nullable } from '@guarani/types';

import { Client } from './client.entity';
import { Consent } from './consent.entity';
import { Session } from './session.entity';

@Entity({ name: 'grants' })
@Unique('grants_login_challenge_and_consent_challenge_uq', ['loginChallenge', 'consentChallenge'])
// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
export class Grant extends mixin(BaseEntity, OAuth2Grant) {
  @PrimaryGeneratedColumn('uuid', { name: 'id', primaryKeyConstraintName: 'grants_pk' })
  public readonly id!: string;

  @Column({ name: 'login_challenge', type: 'varchar', nullable: false, unique: true })
  @Check('check_login_challenge_length', 'length("login_challenge") = 32')
  public readonly loginChallenge!: string;

  @Column({ name: 'consent_challenge', type: 'varchar', nullable: false, unique: true })
  @Check('check_consent_challenge_length', 'length("consent_challenge") = 32')
  public readonly consentChallenge!: string;

  @Column({ name: 'parameters', type: 'json', nullable: false })
  public readonly parameters!: AuthorizationRequest;

  @Column({ name: 'interactions', type: 'varchar', array: true, default: "'{}'", nullable: false })
  public readonly interactions!: InteractionType[];

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

  @OneToOne(() => Consent, { cascade: false, eager: true, nullable: true, onDelete: 'SET NULL', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'consent_id', referencedColumnName: 'id', foreignKeyConstraintName: 'consents_id_fk' })
  public consent!: Nullable<Consent>;
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
export interface Grant extends BaseEntity, OAuth2Grant {}
