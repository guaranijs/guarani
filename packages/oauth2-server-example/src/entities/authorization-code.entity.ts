import { AuthorizationCodeEntity as BaseAuthorizationCodeEntity, SupportedPkceMethod } from '@guarani/oauth2-server';
import { Optional } from '@guarani/types';

import { BaseEntity, Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { URL } from 'url';

import { ClientEntity } from './client.entity';
import { UserEntity } from './user.entity';

@Entity({ name: 'authorization_codes' })
export class AuthorizationCodeEntity extends BaseEntity implements BaseAuthorizationCodeEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'code' })
  public readonly code!: string;

  @Column({
    name: 'redirect_uri',
    type: 'text',
    transformer: { from: (data: string): URL => new URL(data), to: (data: URL): string => data.href },
  })
  public readonly redirectUri!: URL;

  @Column({
    name: 'scopes',
    type: 'text',
    transformer: {
      from: (data: string): string[] => JSON.parse(data),
      to: (data: string[]): string => JSON.stringify(data),
    },
  })
  public readonly scopes!: string[];

  @Column({ name: 'code_challenge', type: 'varchar', length: 128 })
  public readonly codeChallenge!: string;

  @Column({ name: 'code_challenge_method', type: 'varchar', length: 8, nullable: true })
  public readonly codeChallengeMethod?: Optional<SupportedPkceMethod>;

  @Column({ name: 'is_revoked', type: 'boolean', default: false })
  public isRevoked!: boolean;

  @Column({ name: 'expires_at', type: 'datetime' })
  public readonly expiresAt!: Date;

  @ManyToOne(() => ClientEntity, {
    cascade: true,
    eager: true,
    nullable: false,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'client_id', referencedColumnName: 'client_id' })
  public readonly client!: ClientEntity;

  @ManyToOne(() => UserEntity, {
    cascade: true,
    eager: true,
    nullable: false,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
  public readonly user!: UserEntity;
}
