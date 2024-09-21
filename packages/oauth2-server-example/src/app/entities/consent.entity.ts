import { BaseEntity, Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { Consent as OAuth2Consent } from '@guarani/oauth2-server';
import { mixin } from '@guarani/primitives';

import { Client } from './client.entity';
import { User } from './user.entity';

@Entity({ name: 'consents' })
// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
export class Consent extends mixin(BaseEntity, OAuth2Consent) {
  @PrimaryGeneratedColumn('uuid', { name: 'id', primaryKeyConstraintName: 'consents_pk' })
  public readonly id!: string;

  @Column({ name: 'scopes', type: 'varchar', array: true, nullable: false })
  public readonly scopes!: string[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', nullable: false })
  public readonly createdAt!: Date;

  @Column({ name: 'expires_at', type: 'timestamp', nullable: true })
  public readonly expiresAt!: Date | null;

  @ManyToOne(() => Client, { cascade: false, eager: true, nullable: false, onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'client_id', referencedColumnName: 'id', foreignKeyConstraintName: 'clients_id_fk' })
  public readonly client!: Client;

  @ManyToOne(() => User, { cascade: false, eager: true, nullable: false, onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id', foreignKeyConstraintName: 'users_id_fk' })
  public readonly user!: User;
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
export interface Consent extends BaseEntity, OAuth2Consent {}
