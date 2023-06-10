import { BaseEntity, Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { Login as OAuth2Login } from '@guarani/oauth2-server';
import { Nullable } from '@guarani/types';

import { Session } from './session.entity';
import { User } from './user.entity';

@Entity({ name: 'logins' })
export class Login extends BaseEntity implements OAuth2Login {
  @PrimaryGeneratedColumn('uuid', { name: 'id', primaryKeyConstraintName: 'logins_pk' })
  public readonly id!: string;

  @Column({ name: 'amr', type: 'varchar', array: true, nullable: true })
  public readonly amr!: Nullable<string[]>;

  @Column({ name: 'acr', type: 'varchar', nullable: true })
  public readonly acr!: Nullable<string>;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', nullable: false })
  public readonly createdAt!: Date;

  @Column({ name: 'expires_at', type: 'timestamp', nullable: true })
  public readonly expiresAt!: Nullable<Date>;

  @ManyToOne(() => User, { cascade: false, eager: true, nullable: false, onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id', foreignKeyConstraintName: 'users_id_fk' })
  public readonly user!: User;

  @ManyToOne(() => Session, { cascade: false, nullable: false, onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'session_id', referencedColumnName: 'id', foreignKeyConstraintName: 'sessions_id_fk' })
  public readonly session!: Session;
}
