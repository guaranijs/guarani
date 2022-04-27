import { RefreshToken } from '@guarani/oauth2-server';

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

@Entity({ name: 'refresh_tokens' })
export class RefreshTokenEntity extends BaseEntity implements RefreshToken {
  @PrimaryColumn({ name: 'refresh_token', type: 'varchar', length: 16 })
  public readonly token!: string;

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
