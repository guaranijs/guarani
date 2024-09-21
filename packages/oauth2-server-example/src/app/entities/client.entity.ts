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

import {
  JsonWebEncryptionContentEncryptionAlgorithm,
  JsonWebEncryptionKeyWrapAlgorithm,
  JsonWebKeySetParameters,
  JsonWebSignatureAlgorithm,
} from '@guarani/jose';
import {
  ApplicationType,
  Client as OAuth2Client,
  ClientAuthentication,
  GrantType,
  ResponseType,
  SubjectType,
} from '@guarani/oauth2-server';
import { mixin } from '@guarani/primitives';
import { Nullable } from '@guarani/types';

@Entity({ name: 'clients' })
@Check('check_secret_expiration', '"secret" IS NOT NULL OR "secret_expires_at" IS NULL')
@Check('check_jwks_uri_and_jwks', '"jwks_uri" IS NULL OR "jwks" IS NULL')
@Check(
  'check_subject_type_and_sector_identifier_uri',
  '("subject_type" = \'pairwise\' AND "sector_identifier_uri" IS NOT NULL) OR ' +
    '("subject_type" = \'public\' AND "sector_identifier_uri" IS NULL)',
)
@Check(
  'check_subject_type_and_pairwise_salt',
  '("subject_type" = \'pairwise\' AND "pairwise_salt" IS NOT NULL) OR ' +
    '("subject_type" = \'public\' AND "pairwise_salt" IS NULL)',
)
@Check(
  'check_id_token_encrypted_response_key_wrap_and_id_token_encrypted_response_content_encryption',
  '"id_token_encrypted_response_key_wrap" IS NOT NULL OR "id_token_encrypted_response_content_encryption" IS NULL',
)
@Check(
  'check_backchannel_logout_uri_and_backchannel_logout_session_required',
  '"backchannel_logout_uri" IS NOT NULL OR "backchannel_logout_session_required" IS NULL',
)
// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
export class Client extends mixin(BaseEntity, OAuth2Client) {
  @PrimaryGeneratedColumn('uuid', { name: 'id', primaryKeyConstraintName: 'clients_pk' })
  public readonly id!: string;

  @Column({ name: 'secret', type: 'varchar', nullable: true, unique: true })
  @Check('check_secret_length', 'length("secret") = 32')
  public secret!: Nullable<string>;

  @Column({ name: 'secret_expires_at', type: 'timestamp', nullable: true })
  public secretExpiresAt!: Nullable<Date>;

  @Column({ name: 'name', type: 'varchar', nullable: false })
  @Check('check_name_length', 'length("name") >= 4 AND length("name") <= 32')
  public name!: string;

  @Column({ name: 'redirect_uris', type: 'varchar', array: true, nullable: false })
  public redirectUris!: string[];

  @Column({ name: 'response_types', type: 'varchar', array: true, default: '\'{"code"}\'', nullable: false })
  public responseTypes!: ResponseType[];

  @Column({ name: 'grant_types', type: 'varchar', array: true, default: '\'{"authorization_code"}\'', nullable: false })
  public grantTypes!: (GrantType | 'implicit')[];

  @Column({ name: 'application_type', type: 'varchar', default: "'web'", nullable: false })
  public applicationType!: ApplicationType;

  @Column({ name: 'authentication_method', type: 'varchar', default: "'client_secret_basic'", nullable: false })
  public authenticationMethod!: ClientAuthentication;

  @Column({ name: 'authentication_signing_algorithm', type: 'varchar', nullable: true })
  @Check('check_authentication_signing_algorithm', '"authentication_signing_algorithm" <> \'none\'')
  public authenticationSigningAlgorithm!: Nullable<Exclude<JsonWebSignatureAlgorithm, 'none'>>;

  @Column({ name: 'scopes', type: 'varchar', array: true, nullable: false })
  public scopes!: string[];

  @Column({ name: 'client_uri', type: 'varchar', nullable: true })
  public clientUri!: Nullable<string>;

  @Column({ name: 'logo_uri', type: 'varchar', nullable: true })
  public logoUri!: Nullable<string>;

  @Column({ name: 'contacts', type: 'varchar', array: true, nullable: true })
  public contacts!: Nullable<string[]>;

  @Column({ name: 'policy_uri', type: 'varchar', nullable: true })
  public policyUri!: Nullable<string>;

  @Column({ name: 'tos_uri', type: 'varchar', nullable: true })
  public tosUri!: Nullable<string>;

  @Column({ name: 'jwks_uri', type: 'varchar', nullable: true })
  public jwksUri!: Nullable<string>;

  @Column({ name: 'jwks', type: 'json', nullable: true })
  public jwks!: Nullable<JsonWebKeySetParameters>;

  @Column({ name: 'subject_type', type: 'varchar', default: "'public'", nullable: false })
  public subjectType!: SubjectType;

  @Column({ name: 'sector_identifier_uri', type: 'varchar', nullable: true })
  public sectorIdentifierUri!: Nullable<string>;

  @Column({ name: 'pairwise_salt', type: 'varchar', nullable: true, unique: true })
  @Check('check_pairwise_salt_length', 'length("pairwise_salt") = 32')
  public pairwiseSalt!: Nullable<string>;

  @Column({ name: 'id_token_signed_response_algorithm', default: "'RS256'", type: 'varchar', nullable: false })
  @Check('check_id_token_signed_response_algorithm', '"id_token_signed_response_algorithm" <> \'none\'')
  public idTokenSignedResponseAlgorithm!: Exclude<JsonWebSignatureAlgorithm, 'none'>;

  @Column({ name: 'id_token_encrypted_response_key_wrap', type: 'varchar', nullable: true })
  public idTokenEncryptedResponseKeyWrap!: Nullable<JsonWebEncryptionKeyWrapAlgorithm>;

  @Column({ name: 'id_token_encrypted_response_content_encryption', type: 'varchar', nullable: true })
  public idTokenEncryptedResponseContentEncryption!: Nullable<JsonWebEncryptionContentEncryptionAlgorithm>;

  @Column({ name: 'userinfo_signed_response_algorithm', type: 'varchar', nullable: true })
  @Check('check_userinfo_signed_response_algorithm', '"userinfo_signed_response_algorithm" <> \'none\'')
  public userinfoSignedResponseAlgorithm!: Nullable<Exclude<JsonWebSignatureAlgorithm, 'none'>>;

  @Column({ name: 'userinfo_encrypted_response_key_wrap', type: 'varchar', nullable: true })
  public userinfoEncryptedResponseKeyWrap!: Nullable<JsonWebEncryptionKeyWrapAlgorithm>;

  @Column({ name: 'userinfo_encrypted_response_content_encryption', type: 'varchar', nullable: true })
  public userinfoEncryptedResponseContentEncryption!: Nullable<JsonWebEncryptionContentEncryptionAlgorithm>;

  // @Column({ name: 'request_object_signing_algorithm', type: 'varchar', nullable: true })
  // @Check('check_request_object_signing_algorithm', '"request_object_signing_algorithm" <> \'none\'')
  // public requestObjectSigningAlgorithm!: Nullable<Exclude<JsonWebSignatureAlgorithm, 'none'>>;

  // @Column({ name: 'request_object_encryption_key_wrap', type: 'varchar', nullable: true })
  // public requestObjectEncryptionKeyWrap!: Nullable<JsonWebEncryptionKeyWrapAlgorithm>;

  // @Column({ name: 'request_object_encryption_content_encryption', type: 'varchar', nullable: true })
  // public requestObjectEncryptionContentEncryption!: Nullable<JsonWebEncryptionContentEncryptionAlgorithm>;

  @Column({ name: 'authorization_signed_response_algorithm', type: 'varchar', nullable: true })
  @Check('check_authorization_signed_response_algorithm', '"authorization_signed_response_algorithm" <> \'none\'')
  public authorizationSignedResponseAlgorithm!: Nullable<Exclude<JsonWebSignatureAlgorithm, 'none'>>;

  @Column({ name: 'authorization_encrypted_response_key_wrap', type: 'varchar', nullable: true })
  public authorizationEncryptedResponseKeyWrap!: Nullable<JsonWebEncryptionKeyWrapAlgorithm>;

  @Column({ name: 'authorization_encrypted_response_content_encryption', type: 'varchar', nullable: true })
  public authorizationEncryptedResponseContentEncryption!: Nullable<JsonWebEncryptionContentEncryptionAlgorithm>;

  @Column({ name: 'default_max_age', type: 'integer', nullable: true })
  @Check('check_default_max_age', '"default_max_age" > 0')
  public defaultMaxAge!: Nullable<number>;

  @Column({ name: 'require_auth_time', type: 'boolean', default: false, nullable: false })
  public requireAuthTime!: boolean;

  @Column({ name: 'default_acr_values', type: 'varchar', array: true, nullable: true })
  public defaultAcrValues!: Nullable<string[]>;

  @Column({ name: 'initiate_login_uri', type: 'varchar', nullable: true })
  public initiateLoginUri!: Nullable<string>;

  // @Column({ name: 'request_uris', type: 'varchar', array: true, nullable: true })
  // public requestUris!: Nullable<string[]>;

  @Column({ name: 'post_logout_redirect_uris', type: 'varchar', array: true, nullable: true })
  public postLogoutRedirectUris!: Nullable<string[]>;

  @Column({ name: 'backchannel_logout_uri', type: 'varchar', nullable: true })
  public backChannelLogoutUri!: Nullable<string>;

  @Column({ name: 'backchannel_logout_session_required', type: 'boolean', nullable: true })
  public backChannelLogoutSessionRequired!: Nullable<boolean>;

  @Column({ name: 'software_id', type: 'varchar', nullable: true })
  public softwareId!: Nullable<string>;

  @Column({ name: 'software_version', type: 'varchar', nullable: true })
  public softwareVersion!: Nullable<string>;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', nullable: false })
  public readonly createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', nullable: false })
  public updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
  public deletedAt!: Nullable<Date>;
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
export interface Client extends BaseEntity, OAuth2Client {}
