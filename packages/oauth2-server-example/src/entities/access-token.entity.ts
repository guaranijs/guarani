import { AccessTokenEntity, SupportedTokenType } from '@guarani/oauth2-server';
import { Optional } from '@guarani/types';

import { BaseEntity, Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';

import { Client } from './client.entity';
import { RefreshToken } from './refresh-token.entity';
import { User } from './user.entity';

@Entity({ name: 'access_tokens' })
export class AccessToken extends BaseEntity implements AccessTokenEntity {
  @PrimaryColumn({ name: 'access_token', type: 'varchar', length: 24 })
  public readonly token!: string;

  @Column({ name: 'token_type', type: 'varchar' })
  public readonly tokenType!: SupportedTokenType;

  @Column({
    name: 'scopes',
    type: 'text',
    transformer: {
      from: (data: string): string[] => JSON.parse(data),
      to: (data: string[]): string => JSON.stringify(data),
    },
  })
  public readonly scopes!: string[];

  @Column({ name: 'is_revoked', type: 'boolean', default: false })
  public isRevoked!: boolean;

  @Column({ name: 'expires_at', type: 'datetime' })
  public readonly expiresAt!: Date;

  @ManyToOne(() => Client, {
    cascade: true,
    eager: true,
    nullable: false,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'client_id', referencedColumnName: 'id' })
  public readonly client!: Client;

  @ManyToOne(() => User, { cascade: true, eager: true, nullable: true, onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
  public readonly user?: Optional<User>;

  @ManyToOne(() => RefreshToken, {
    cascade: true,
    eager: true,
    nullable: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'refresh_token', referencedColumnName: 'token' })
  public readonly refreshToken?: Optional<RefreshToken>;
}
