import { UserEntity } from '@guarani/oauth2-server';

import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'users' })
export class User extends BaseEntity implements UserEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  public readonly id!: string;

  @Column({ name: 'password', type: 'text' })
  public password!: string;

  @Column({ name: 'email', type: 'varchar', length: 64, unique: true })
  public email!: string;

  @Column({ name: 'username', type: 'varchar', length: 16, unique: true })
  public username!: string;
}
