import { BaseEntity, Check, Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';

import { AccessToken as OAuth2AccessToken } from '@guarani/oauth2-server';
import { mixin } from '@guarani/primitives';
import { Nullable } from '@guarani/types';

import { Client } from './client.entity';
import { User } from './user.entity';

@Entity({ name: 'access_tokens' })
// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
export class AccessToken extends mixin(BaseEntity, OAuth2AccessToken) {
  @PrimaryColumn({
    name: 'id',
    type: 'varchar',
    length: 32,
    nullable: false,
    primary: true,
    primaryKeyConstraintName: 'access_tokens_pk',
  })
  @Check('check_id_length', 'length("id") = 32')
  public readonly id!: string;

  @Column({ name: 'scopes', type: 'varchar', array: true, nullable: false })
  public readonly scopes!: string[];

  @Column({ name: 'is_revoked', type: 'boolean', default: false, nullable: false })
  public isRevoked!: boolean;

  @Column({ name: 'issued_at', type: 'timestamp', nullable: false })
  public readonly issuedAt!: Date;

  @Column({ name: 'expires_at', type: 'timestamp', nullable: false })
  public readonly expiresAt!: Date;

  @Column({ name: 'valid_after', type: 'timestamp', nullable: false })
  public readonly validAfter!: Date;

  @ManyToOne(() => Client, { cascade: false, eager: true, nullable: true, onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'client_id', referencedColumnName: 'id', foreignKeyConstraintName: 'clients_id_fk' })
  public readonly client!: Nullable<Client>;

  @ManyToOne(() => User, { cascade: false, eager: true, nullable: true, onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id', foreignKeyConstraintName: 'users_id_fk' })
  public readonly user!: Nullable<User>;
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
export interface AccessToken extends BaseEntity, OAuth2AccessToken {}
