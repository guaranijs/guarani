import {
  ApplicationType,
  Client,
  ClientAuthentication,
  ClientType,
  GrantType,
  ResponseType,
} from '@guarani/oauth2-server';
import { Optional } from '@guarani/types';

import {
  BaseEntity,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  ValueTransformer,
} from 'typeorm';

const transformer: ValueTransformer = {
  from: (data: string): string[] => JSON.parse(data),
  to: (data: string[]): string => JSON.stringify(data),
};

@Entity({ name: 'clients' })
export class ClientEntity extends BaseEntity implements Client {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  public readonly id!: string;

  @Column({ name: 'secret', type: 'varchar', unique: true })
  public secret!: string;

  @Column({ name: 'name', type: 'varchar', length: 32 })
  public name!: string;

  @Column({ name: 'redirect_uris', type: 'varchar', transformer })
  public redirectUris!: string[];

  @Column({ name: 'response_types', type: 'varchar', transformer })
  public responseTypes!: ResponseType[];

  @Column({ name: 'grant_types', type: 'varchar', transformer })
  public grantTypes!: GrantType[];

  @Column({ name: 'application_type', type: 'varchar' })
  public applicationType!: ApplicationType;

  @Column({ name: 'authentication_method', type: 'varchar' })
  public authenticationMethod!: ClientAuthentication;

  @Column({ name: 'scopes', type: 'varchar', transformer })
  public scopes!: string[];

  @Column({ name: 'client_type', type: 'varchar' })
  public clientType!: ClientType;

  @Column({ name: 'access_token_lifetime', type: 'integer', default: 60 * 60 })
  public accessTokenLifetime!: number;

  @Column({ name: 'refresh_token_lifetime', type: 'integer', default: 60 * 60 * 24 })
  public refreshTokenLifetime!: number;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  public readonly createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  public readonly updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'datetime' })
  public readonly deletedAt?: Optional<Date>;
}
