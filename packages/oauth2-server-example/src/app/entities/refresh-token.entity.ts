import { BaseEntity, Check, Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';

import { RefreshToken as OAuth2RefreshToken } from '@guarani/oauth2-server';

import { Client } from './client.entity';
import { User } from './user.entity';

@Entity({ name: 'refresh_tokens' })
export class RefreshToken extends BaseEntity implements OAuth2RefreshToken {
  @PrimaryColumn({
    name: 'handle',
    type: 'varchar',
    length: 24,
    nullable: false,
    primary: true,
    primaryKeyConstraintName: 'refresh_tokens_pk',
  })
  @Check('check_handle_length', 'length("handle") = 24')
  public readonly handle!: string;

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

  @ManyToOne(() => Client, { cascade: false, eager: true, nullable: false, onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'client_id', referencedColumnName: 'id', foreignKeyConstraintName: 'clients_id_fk' })
  public readonly client!: Client;

  @ManyToOne(() => User, { cascade: false, eager: true, nullable: false, onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id', foreignKeyConstraintName: 'users_id_fk' })
  public readonly user!: User;
}
