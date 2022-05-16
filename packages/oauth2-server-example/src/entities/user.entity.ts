import { Nullable } from '@guarani/types';

import {
  BaseEntity,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'users' })
export class UserEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  public readonly id!: string;

  @Column({ name: 'email', type: 'varchar', length: 128, unique: true })
  public email!: string;

  @Column({ name: 'password', type: 'varchar', length: 60 })
  public password!: string;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  public readonly createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  public readonly updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'datetime', nullable: true })
  public readonly deletedAt!: Nullable<Date>;
}
