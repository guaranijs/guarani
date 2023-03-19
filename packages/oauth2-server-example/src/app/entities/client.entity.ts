import {
  ApplicationType,
  Client as OAuth2Client,
  ClientAuthentication,
  GrantType,
  ResponseType,
} from '@guarani/oauth2-server';

import {
  BaseEntity,
  Check,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'clients' })
@Check('check_secret_expiration', '"secret" IS NOT NULL OR "secret_expires_at" IS NULL')
export class Client extends BaseEntity implements OAuth2Client {
  @PrimaryGeneratedColumn('uuid', { name: 'id', primaryKeyConstraintName: 'clients_pk' })
  public readonly id!: string;

  @Column({ name: 'secret', type: 'varchar', nullable: true, unique: true })
  @Check('check_secret_length', 'length("secret") = 32')
  public secret!: string | null;

  @Column({ name: 'secret_expires_at', type: 'timestamp', nullable: true })
  public secretExpiresAt!: Date | null;

  @Column({ name: 'name', type: 'varchar', nullable: false })
  @Check('check_name_length', 'length("name") >= 4 AND length("name") <= 32')
  public name!: string;

  @Column({ name: 'redirect_uris', type: 'varchar', array: true, nullable: false })
  public redirectUris!: string[];

  @Column({ name: 'response_types', type: 'varchar', array: true, default: '["code"]', nullable: false })
  public responseTypes!: ResponseType[];

  @Column({ name: 'grant_types', type: 'varchar', array: true, default: '["authorization_code"]', nullable: false })
  public grantTypes!: GrantType[];

  @Column({ name: 'application_type', type: 'varchar', default: 'web', nullable: false })
  public applicationType!: ApplicationType;

  @Column({ name: 'authentication_method', type: 'varchar', default: 'client_secret_basic', nullable: false })
  public authenticationMethod!: ClientAuthentication;

  @Column({ name: 'scopes', type: 'varchar', array: true, nullable: false })
  public scopes!: string[];

  @Column({ name: 'logo_uri', type: 'varchar', nullable: true })
  public logoUri!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', nullable: false })
  public readonly createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', nullable: false })
  public updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
  public deletedAt!: Date | null;
}
