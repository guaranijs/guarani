import { BaseEntity, Entity, JoinColumn, OneToMany, OneToOne, PrimaryGeneratedColumn } from 'typeorm';

import { Session as OAuth2Session } from '@guarani/oauth2-server';
import { Nullable } from '@guarani/types';

import { Login } from './login.entity';

@Entity({ name: 'sessions' })
export class Session extends BaseEntity implements OAuth2Session {
  @PrimaryGeneratedColumn('uuid', { name: 'id', primaryKeyConstraintName: 'sessions_pk' })
  public readonly id!: string;

  @OneToOne(() => Login, { cascade: false, eager: true, nullable: true, onDelete: 'SET NULL', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'active_login_id', referencedColumnName: 'id', foreignKeyConstraintName: 'logins_id_fk' })
  public activeLogin!: Nullable<Login>;

  @OneToMany(() => Login, (login) => login.session, {
    cascade: true,
    eager: true,
    nullable: false,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  public logins!: Login[];
}
