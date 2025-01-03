import {
  BaseEntity,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { User as OAuth2User } from '@guarani/oauth2-server';
import { mixin } from '@guarani/primitives';
import { Nullable } from '@guarani/types';

import { Address } from './address.entity';

@Entity({ name: 'users' })
// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
export class User extends mixin(BaseEntity, OAuth2User) {
  @PrimaryGeneratedColumn('uuid', { name: 'id', primaryKeyConstraintName: 'users_pk' })
  public readonly id!: string;

  @Column({ name: 'password', type: 'varchar', nullable: false })
  public password!: string;

  @Column({ name: 'given_name', type: 'varchar', nullable: false })
  public givenName!: string;

  @Column({ name: 'middle_name', type: 'varchar', nullable: true })
  public middleName!: Nullable<string>;

  @Column({ name: 'family_name', type: 'varchar', nullable: false })
  public familyName!: string;

  @Column({ name: 'picture', type: 'varchar', nullable: true })
  public picture!: Nullable<string>;

  @Column({ name: 'email', type: 'varchar', nullable: false, unique: true })
  public email!: string;

  @Column({ name: 'email_verified', type: 'boolean', default: false, nullable: false })
  public emailVerified!: boolean;

  @Column({ name: 'gender', type: 'varchar', nullable: true })
  public gender!: Nullable<string>;

  @Column({ name: 'birthdate', type: 'date', nullable: false })
  public birthdate!: string;

  @Column({ name: 'phone_number', type: 'varchar', nullable: false, unique: true })
  public phoneNumber!: string;

  @Column({ name: 'phone_number_verified', type: 'boolean', default: false, nullable: false })
  public phoneNumberVerified!: boolean;

  @Column(() => Address, { prefix: '' })
  public address!: Address;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', nullable: false })
  public readonly createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', nullable: false })
  public updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
  public deletedAt!: Nullable<Date>;

  public get name(): string {
    const components: string[] = [this.givenName, this.familyName];

    if (this.middleName !== null) {
      components.splice(1, 0, this.middleName);
    }

    return components.join(' ');
  }
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
export interface User extends BaseEntity, OAuth2User {}
