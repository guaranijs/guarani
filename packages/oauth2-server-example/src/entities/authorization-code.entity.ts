import { AuthorizationCode, PkceMethod } from '@guarani/oauth2-server';

import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  ValueTransformer,
} from 'typeorm';

import { ClientEntity } from './client.entity';
import { UserEntity } from './user.entity';

const transformer: ValueTransformer = {
  from: (data: string): string[] => JSON.parse(data),
  to: (data: string[]): string => JSON.stringify(data),
};

@Entity({ name: 'authorization_codes' })
export class AuthorizationCodeEntity extends BaseEntity implements AuthorizationCode {
  @PrimaryGeneratedColumn('uuid', { name: 'code' })
  public readonly code!: string;

  @Column({ name: 'redirect_uri', type: 'varchar' })
  public readonly redirectUri!: string;

  @Column({ name: 'code_challenge', type: 'varchar' })
  public readonly codeChallenge!: string;

  @Column({ name: 'code_challenge_method', type: 'varchar' })
  public readonly codeChallengeMethod!: PkceMethod;

  @Column({ name: 'scopes', type: 'varchar', transformer })
  public readonly scopes!: string[];

  @Column({ name: 'is_revoked', type: 'boolean', default: false })
  public isRevoked!: boolean;

  @CreateDateColumn({ name: 'issued_at', type: 'datetime' })
  public readonly issuedAt!: Date;

  @Column({ name: 'expires_at', type: 'datetime' })
  public readonly expiresAt!: Date;

  @Column({ name: 'valid_after', type: 'datetime' })
  public readonly validAfter!: Date;

  @ManyToOne(() => ClientEntity, { eager: true })
  @JoinColumn({ name: 'client_id', referencedColumnName: 'id' })
  public readonly client!: ClientEntity;

  @ManyToOne(() => UserEntity, { eager: true })
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
  public readonly user!: UserEntity;
}
