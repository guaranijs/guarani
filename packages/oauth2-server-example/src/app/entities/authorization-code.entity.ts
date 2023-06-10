import { BaseEntity, Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';

import { AuthorizationCode as OAuth2AuthorizationCode, CodeAuthorizationRequest } from '@guarani/oauth2-server';

import { Consent } from './consent.entity';
import { Login } from './login.entity';

@Entity({ name: 'authorization_codes' })
@Unique('authorization_codes_login_id_and_consent_id_uq', ['login', 'consent'])
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

  @OneToOne(() => Login, { cascade: false, eager: true, nullable: false, onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'login_id', referencedColumnName: 'id', foreignKeyConstraintName: 'logins_id_fk' })
  public readonly login!: Login;

  @OneToOne(() => Consent, { cascade: false, eager: true, nullable: false, onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'consent_id', referencedColumnName: 'id', foreignKeyConstraintName: 'consents_id_fk' })
  public readonly consent!: Consent;
}
