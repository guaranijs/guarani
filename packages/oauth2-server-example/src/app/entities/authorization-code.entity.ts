import { AuthorizationCode as OAuth2AuthorizationCode, CodeAuthorizationRequest } from '@guarani/oauth2-server';

import { BaseEntity, Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';

import { Consent } from './consent.entity';
import { Session } from './session.entity';

@Entity({ name: 'authorization_codes' })
@Unique('authorization_codes_session_id_and_consent_id_uq', ['session', 'consent'])
export class AuthorizationCode extends BaseEntity implements OAuth2AuthorizationCode {
  @PrimaryGeneratedColumn('uuid', { name: 'code', primaryKeyConstraintName: 'authorization_codes_pk' })
  public readonly code!: string;

  @Column({ name: 'is_revoked', type: 'boolean', default: false, nullable: false })
  public isRevoked!: boolean;

  @Column({ name: 'parameters', type: 'json', nullable: false })
  public readonly parameters!: CodeAuthorizationRequest;

  @Column({ name: 'issued_at', type: 'timestamp', nullable: false })
  public readonly issuedAt!: Date;

  @Column({ name: 'expires_at', type: 'timestamp', nullable: false })
  public readonly expiresAt!: Date;

  @Column({ name: 'valid_after', type: 'timestamp', nullable: false })
  public readonly validAfter!: Date;

  @OneToOne(() => Session, { cascade: false, eager: true, nullable: false, onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'session_id', referencedColumnName: 'id', foreignKeyConstraintName: 'sessions_id_fk' })
  public readonly session!: Session;

  @OneToOne(() => Consent, { cascade: false, eager: true, nullable: false, onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'consent_id', referencedColumnName: 'id', foreignKeyConstraintName: 'consents_id_fk' })
  public readonly consent!: Consent;
}
