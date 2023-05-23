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
@Check(
  'check_secret_issuance',
  '("secret" IS NULL AND "secret_issued_at" IS NULL) OR ("secret" IS NOT NULL AND "secret_issued_at" IS NOT NULL)'
)
@Check('check_secret_expiration', '"secret" IS NOT NULL OR "secret_expires_at" IS NULL')
@Check('check_jwks_uri_and_jwks', '"jwks_uri" IS NULL OR "jwks" IS NULL')
@Check(
  'check_subject_type_and_sector_identifier_uri',
  '("subject_type" = \'pairwise\' AND "sector_identifier_uri" IS NOT NULL) OR ' +
    '("subject_type" = \'public\' AND "sector_identifier_uri" IS NULL)'
)
@Check(
  'check_subject_type_and_pairwise_salt',
  '("subject_type" = \'pairwise\' AND "pairwise_salt" IS NOT NULL) OR ' +
    '("subject_type" = \'public\' AND "pairwise_salt" IS NULL)'
)
@Check(
  'check_id_token_encrypted_response_key_wrap_and_id_token_encrypted_response_content_encryption',
  '"id_token_encrypted_response_key_wrap" IS NOT NULL OR "id_token_encrypted_response_content_encryption" IS NULL'
)
export class Client extends BaseEntity implements OAuth2Client {
  @PrimaryGeneratedColumn('uuid', { name: 'id', primaryKeyConstraintName: 'clients_pk' })
  public readonly id!: string;

  @Column({ name: 'secret', type: 'varchar', nullable: true, unique: true })
  @Check('check_secret_length', 'length("secret") = 32')
  public secret!: string | null;

  @Column({ name: 'secret_issued_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', nullable: true })
  public secretIssuedAt!: Date | null;

  @Column({ name: 'secret_expires_at', type: 'timestamp', nullable: true })
  public secretExpiresAt!: Date | null;

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
  public authenticationSigningAlgorithm!: Exclude<JsonWebSignatureAlgorithm, 'none'> | null;

  @Column({ name: 'scopes', type: 'varchar', array: true, nullable: false })
  public scopes!: string[];

  @Column({ name: 'client_uri', type: 'varchar', nullable: true })
  public clientUri!: string | null;

  @Column({ name: 'logo_uri', type: 'varchar', nullable: true })
  public logoUri!: string | null;

  @Column({ name: 'contacts', type: 'varchar', array: true, nullable: true })
  public contacts!: string[] | null;

  @Column({ name: 'policy_uri', type: 'varchar', nullable: true })
  public policyUri!: string | null;

  @Column({ name: 'tos_uri', type: 'varchar', nullable: true })
  public tosUri!: string | null;

  @Column({ name: 'jwks_uri', type: 'varchar', nullable: true })
  public jwksUri!: string | null;

  @Column({ name: 'jwks', type: 'json', nullable: true })
  public jwks!: JsonWebKeySetParameters | null;

  @Column({ name: 'subject_type', type: 'varchar', default: 'public', nullable: false })
  public subjectType!: SubjectType;

  @Column({ name: 'sector_identifier_uri', type: 'varchar', nullable: true })
  public sectorIdentifierUri!: string | null;

  @Column({ name: 'pairwise_salt', type: 'varchar', nullable: true, unique: true })
  @Check('check_pairwise_salt_length', 'length("pairwise_salt") = 32')
  public pairwiseSalt!: string | null;

  @Column({ name: 'id_token_signed_response_algorithm', type: 'varchar', nullable: false })
  @Check('check_id_token_signed_response_algorithm', '"id_token_signed_response_algorithm" <> \'none\'')
  public idTokenSignedResponseAlgorithm!: Exclude<JsonWebSignatureAlgorithm, 'none'>;

  @Column({ name: 'id_token_encrypted_response_key_wrap', type: 'varchar', nullable: true })
  public idTokenEncryptedResponseKeyWrap!: JsonWebEncryptionKeyWrapAlgorithm | null;

  @Column({ name: 'id_token_encrypted_response_content_encryption', type: 'varchar', nullable: true })
  public idTokenEncryptedResponseContentEncryption!: JsonWebEncryptionContentEncryptionAlgorithm | null;

  // @Column({ name: 'userinfo_signed_response_algorithm', type: 'varchar', nullable: true })
  // @Check('check_userinfo_signed_response_algorithm', '"userinfo_signed_response_algorithm" <> \'none\'')
  // public userinfoSignedResponseAlgorithm!: Exclude<JsonWebSignatureAlgorithm, 'none'> | null;

  // @Column({ name: 'userinfo_encrypted_response_key_wrap', type: 'varchar', nullable: true })
  // public userinfoEncryptedResponseKeyWrap!: JsonWebEncryptionKeyWrapAlgorithm | null;

  // @Column({ name: 'userinfo_encrypted_response_content_encryption', type: 'varchar', nullable: true })
  // public userinfoEncryptedResponseContentEncryption!: JsonWebEncryptionContentEncryptionAlgorithm | null;

  // @Column({ name: 'request_object_signing_algorithm', type: 'varchar', nullable: true })
  // @Check('check_request_object_signing_algorithm', '"request_object_signing_algorithm" <> \'none\'')
  // public requestObjectSigningAlgorithm!: Exclude<JsonWebSignatureAlgorithm, 'none'> | null;

  // @Column({ name: 'request_object_encryption_key_wrap', type: 'varchar', nullable: true })
  // public requestObjectEncryptionKeyWrap!: JsonWebEncryptionKeyWrapAlgorithm | null;

  // @Column({ name: 'request_object_encryption_content_encryption', type: 'varchar', nullable: true })
  // public requestObjectEncryptionContentEncryption!: JsonWebEncryptionContentEncryptionAlgorithm | null;

  @Column({ name: 'default_max_age', type: 'integer', nullable: true })
  @Check('check_default_max_age', '"default_max_age" > 0')
  public defaultMaxAge!: number | null;

  @Column({ name: 'require_auth_time', type: 'boolean', default: false, nullable: false })
  public requireAuthTime!: boolean;

  @Column({ name: 'default_acr_values', type: 'varchar', array: true, nullable: true })
  public defaultAcrValues!: string[] | null;

  @Column({ name: 'initiate_login_uri', type: 'varchar', nullable: true })
  public initiateLoginUri!: string | null;

  // @Column({ name: 'request_uris', type: 'varchar', array: true, nullable: true })
  // public requestUris!: string[] | null;

  @Column({ name: 'software_id', type: 'varchar', nullable: true })
  public softwareId!: string | null;

  @Column({ name: 'post_logout_redirect_uris', type: 'varchar', array: true, default: "'{}'", nullable: false })
  public postLogoutRedirectUris!: string[];

  @Column({ name: 'software_version', type: 'varchar', nullable: true })
  public softwareVersion!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', nullable: false })
  public readonly createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', nullable: false })
  public updatedAt!: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
  public deletedAt!: Date | null;
}
