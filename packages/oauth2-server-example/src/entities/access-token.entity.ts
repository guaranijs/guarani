import { AccessToken, TokenType } from '@guarani/oauth2-server';
import { Optional } from '@guarani/types';

import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  ValueTransformer,
} from 'typeorm';

import { ClientEntity } from './client.entity';
import { UserEntity } from './user.entity';

const transformer: ValueTransformer = {
  from: (data: string): string[] => JSON.parse(data),
  to: (data: string[]): string => JSON.stringify(data),
};

@Entity({ name: 'access_tokens' })
export class AccessTokenEntity extends BaseEntity implements AccessToken {
  @PrimaryColumn({ name: 'access_token', type: 'varchar', length: 24 })
  public readonly token!: string;

  @Column({ name: 'token_type', type: 'varchar' })
  public readonly tokenType!: TokenType;

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

  @ManyToOne(() => UserEntity, { eager: true, nullable: true })
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
  public readonly user?: Optional<UserEntity>;
}
