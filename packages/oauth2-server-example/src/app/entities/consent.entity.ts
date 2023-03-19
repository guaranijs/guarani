import { Consent as OAuth2Consent } from '@guarani/oauth2-server';

import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

import { Client } from './client.entity';
import { User } from './user.entity';

@Entity({ name: 'consents' })
@Unique('consents_client_id_and_user_id_uq', ['client', 'user'])
export class Consent extends BaseEntity implements OAuth2Consent {
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
