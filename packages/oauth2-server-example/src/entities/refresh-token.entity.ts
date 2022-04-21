import { RefreshTokenEntity as BaseRefreshTokenEntity, SupportedGrantType } from '@guarani/oauth2-server';

import { BaseEntity, Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';

import { ClientEntity } from './client.entity';
import { UserEntity } from './user.entity';

@Entity({ name: 'refresh_tokens' })
export class RefreshTokenEntity extends BaseEntity implements BaseRefreshTokenEntity {
  @PrimaryColumn({ name: 'refresh_token', type: 'varchar', length: 16 })
  public readonly token!: string;

  @Column({
    name: 'scopes',
    type: 'text',
    transformer: {
      from: (data: string): string[] => JSON.parse(data),
      to: (data: string[]): string => JSON.stringify(data),
    },
  })
  public readonly scopes!: string[];

  @Column({ name: 'grant', type: 'varchar' })
  public readonly grant!: SupportedGrantType;

  @Column({ name: 'is_revoked', type: 'boolean', default: false })
  public readonly isRevoked!: boolean;

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
