import { BaseEntity, Check, Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { URL } from 'url';

import { DeviceCode as OAuth2DeviceCode } from '@guarani/oauth2-server';
import { Nullable } from '@guarani/types';

import { Client } from './client.entity';
import { User } from './user.entity';

@Entity({ name: 'device_codes' })
export class DeviceCode extends BaseEntity implements OAuth2DeviceCode {
  @PrimaryGeneratedColumn('uuid', { name: 'id', primaryKeyConstraintName: 'device_codes_pk' })
  public readonly id!: string;

  @Column({ name: 'user_code', type: 'varchar', nullable: false, unique: true })
  @Check('check_user_code_length', 'length("user_code") = 9')
  public readonly userCode!: string;

  @Column({ name: 'verification_url', type: 'varchar', nullable: false })
  public readonly verificationUri!: string;

  @Column({ name: 'scopes', type: 'varchar', array: true, nullable: false })
  public readonly scopes!: string[];

  @Column({ name: 'is_authorized', type: 'boolean', nullable: true })
  public isAuthorized!: Nullable<boolean>;

  @Column({ name: 'issued_at', type: 'timestamp', nullable: false })
  public readonly issuedAt!: Date;

  @Column({ name: 'expires_at', type: 'timestamp', nullable: false })
  public readonly expiresAt!: Date;

  @Column({ name: 'last_polled', type: 'timestamp', nullable: true })
  public lastPolled!: Nullable<Date>;

  @ManyToOne(() => Client, { cascade: false, eager: true, nullable: false, onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'client_id', referencedColumnName: 'id', foreignKeyConstraintName: 'clients_id_fk' })
  public readonly client!: Client;

  @ManyToOne(() => User, { cascade: false, eager: true, nullable: true, onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id', foreignKeyConstraintName: 'users_id_fk' })
  public user!: Nullable<User>;

  public get verificationUriComplete(): string {
    const url = new URL(this.verificationUri);
    url.searchParams.set('user_code', this.userCode);
    return url.href;
  }
}
