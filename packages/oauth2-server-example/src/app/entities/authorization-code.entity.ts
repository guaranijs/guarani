import { BaseEntity, Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';

import { AuthorizationCode as OAuth2AuthorizationCode, CodeAuthorizationRequest } from '@guarani/oauth2-server';
import { mixin } from '@guarani/primitives';

import { Consent } from './consent.entity';
import { Login } from './login.entity';

@Entity({ name: 'authorization_codes' })
@Unique('authorization_codes_login_id_and_consent_id_uq', ['login', 'consent'])
// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
export class AuthorizationCode extends mixin(BaseEntity, OAuth2AuthorizationCode) {
  @PrimaryGeneratedColumn('uuid', { name: 'id', primaryKeyConstraintName: 'authorization_codes_pk' })
  public readonly id!: string;

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

// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
export interface AuthorizationCode extends BaseEntity, OAuth2AuthorizationCode {}
