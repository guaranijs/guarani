import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateClientsTable1678000960407 implements MigrationInterface {
  public readonly name: string = 'create_clients_table_1678000960407';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = new Table({
      name: 'clients',
      columns: [
        {
          name: 'id',
          type: 'uuid',
          generationStrategy: 'uuid',
          isGenerated: true,
          isNullable: false,
          isPrimary: true,
          primaryKeyConstraintName: 'clients_pk',
        },
        {
          name: 'secret',
          type: 'varchar',
          isNullable: true,
          isUnique: true,
        },
        {
          name: 'secret_expires_at',
          type: 'timestamp',
          isNullable: true,
        },
        {
          name: 'name',
          type: 'varchar',
          isNullable: false,
        },
        {
          name: 'redirect_uris',
          type: 'varchar',
          isArray: true,
          isNullable: false,
        },
        {
          name: 'response_types',
          type: 'varchar',
          default: '\'{"code"}\'',
          isArray: true,
          isNullable: false,
        },
        {
          name: 'grant_types',
          type: 'varchar',
          default: '\'{"authorization_code"}\'',
          isArray: true,
          isNullable: false,
        },
        {
          name: 'application_type',
          type: 'varchar',
          default: "'web'",
          isNullable: false,
        },
        {
          name: 'authentication_method',
          type: 'varchar',
          default: "'client_secret_basic'",
          isNullable: false,
        },
        {
          name: 'authentication_signing_algorithm',
          type: 'varchar',
          isNullable: true,
        },
        {
          name: 'scopes',
          type: 'varchar',
          isArray: true,
          isNullable: false,
        },
        {
          name: 'client_uri',
          type: 'varchar',
          isNullable: true,
        },
        {
          name: 'logo_uri',
          type: 'varchar',
          isNullable: true,
        },
        {
          name: 'contacts',
          type: 'varchar',
          isArray: true,
          isNullable: true,
        },
        {
          name: 'policy_uri',
          type: 'varchar',
          isNullable: true,
        },
        {
          name: 'tos_uri',
          type: 'varchar',
          isNullable: true,
        },
        {
          name: 'jwks_uri',
          type: 'varchar',
          isNullable: true,
        },
        {
          name: 'jwks',
          type: 'json',
          isNullable: true,
        },
        {
          name: 'subject_type',
          type: 'varchar',
          default: "'public'",
          isNullable: false,
        },
        {
          name: 'sector_identifier_uri',
          type: 'varchar',
          isNullable: true,
        },
        {
          name: 'pairwise_salt',
          type: 'varchar',
          isNullable: true,
          isUnique: true,
        },
        {
          name: 'id_token_signed_response_algorithm',
          type: 'varchar',
          default: "'RS256'",
          isNullable: false,
        },
        {
          name: 'id_token_encrypted_response_key_wrap',
          type: 'varchar',
          isNullable: true,
        },
        {
          name: 'id_token_encrypted_response_content_encryption',
          type: 'varchar',
          isNullable: true,
        },
        {
          name: 'userinfo_signed_response_algorithm',
          type: 'varchar',
          isNullable: true,
        },
        {
          name: 'userinfo_encrypted_response_key_wrap',
          type: 'varchar',
          isNullable: true,
        },
        {
          name: 'userinfo_encrypted_response_content_encryption',
          type: 'varchar',
          isNullable: true,
        },
        // {
        //   name: 'request_object_signing_algorithm',
        //   type: 'varchar',
        //   isNullable: true,
        // },
        // {
        //   name: 'request_object_encryption_key_wrap',
        //   type: 'varchar',
        //   isNullable: true,
        // },
        // {
        //   name: 'request_object_encryption_content_encryption',
        //   type: 'varchar',
        //   isNullable: true,
        // },
        {
          name: 'authorization_signed_response_algorithm',
          type: 'varchar',
          isNullable: true,
        },
        {
          name: 'authorization_encrypted_response_key_wrap',
          type: 'varchar',
          isNullable: true,
        },
        {
          name: 'authorization_encrypted_response_content_encryption',
          type: 'varchar',
          isNullable: true,
        },
        {
          name: 'default_max_age',
          type: 'integer',
          isNullable: true,
        },
        {
          name: 'require_auth_time',
          type: 'boolean',
          default: false,
          isNullable: false,
        },
        {
          name: 'default_acr_values',
          type: 'varchar',
          isArray: true,
          isNullable: true,
        },
        {
          name: 'initiate_login_uri',
          type: 'varchar',
          isNullable: true,
        },
        // {
        //   name: 'request_uris',
        //   type: 'varchar',
        //   isArray: true,
        //   isNullable: true,
        // },
        {
          name: 'post_logout_redirect_uris',
          type: 'varchar',
          isArray: true,
          isNullable: true,
        },
        {
          name: 'backchannel_logout_uri',
          type: 'varchar',
          isNullable: true,
        },
        {
          name: 'backchannel_logout_session_required',
          type: 'boolean',
          isNullable: true,
        },
        {
          name: 'software_id',
          type: 'varchar',
          isNullable: true,
        },
        {
          name: 'software_version',
          type: 'varchar',
          isNullable: true,
        },
        {
          name: 'created_at',
          type: 'timestamp',
          default: 'CURRENT_TIMESTAMP',
          isNullable: false,
        },
        {
          name: 'updated_at',
          type: 'timestamp',
          default: 'CURRENT_TIMESTAMP',
          isNullable: false,
        },
        {
          name: 'deleted_at',
          type: 'timestamp',
          isNullable: true,
        },
      ],
      checks: [
        {
          name: 'check_secret_expiration',
          columnNames: ['secret', 'secret_expires_at'],
          expression: '"secret" IS NOT NULL OR "secret_expires_at" IS NULL',
        },
        {
          name: 'check_jwks_uri_and_jwks',
          columnNames: ['jwks_uri', 'jwks'],
          expression: '"jwks_uri" IS NULL OR "jwks" IS NULL',
        },
        {
          name: 'check_subject_type_and_sector_identifier_uri',
          columnNames: ['subject_type', 'sector_identifier_uri'],
          expression:
            '("subject_type" = \'pairwise\' AND "sector_identifier_uri" IS NOT NULL) OR ' +
            '("subject_type" = \'public\' AND "sector_identifier_uri" IS NULL)',
        },
        {
          name: 'check_subject_type_and_pairwise_salt',
          columnNames: ['subject_type', 'pairwise_salt'],
          expression:
            '("subject_type" = \'pairwise\' AND "pairwise_salt" IS NOT NULL) OR ' +
            '("subject_type" = \'public\' AND "pairwise_salt" IS NULL)',
        },
        {
          name: 'check_id_token_encrypted_response_key_wrap_and_id_token_encrypted_response_content_encryption',
          columnNames: ['id_token_encrypted_response_key_wrap', 'id_token_encrypted_response_content_encryption'],
          expression:
            '"id_token_encrypted_response_key_wrap" IS NOT NULL OR ' +
            '"id_token_encrypted_response_content_encryption" IS NULL',
        },
        {
          name: 'check_backchannel_logout_uri_and_backchannel_logout_session_required',
          columnNames: ['backchannel_logout_uri', 'backchannel_logout_session_required'],
          expression: '"backchannel_logout_uri" IS NOT NULL OR "backchannel_logout_session_required" IS NULL',
        },
        {
          name: 'check_secret_length',
          columnNames: ['secret'],
          expression: 'length("secret") = 32',
        },
        {
          name: 'check_name_length',
          columnNames: ['name'],
          expression: 'length("name") >= 4 AND length("name") <= 32',
        },
        {
          name: 'check_authentication_signing_algorithm',
          columnNames: ['authentication_signing_algorithm'],
          expression: '"authentication_signing_algorithm" <> \'none\'',
        },
        {
          name: 'check_pairwise_salt_length',
          columnNames: ['pairwise_salt'],
          expression: 'length("pairwise_salt") = 32',
        },
        {
          name: 'check_id_token_signed_response_algorithm',
          columnNames: ['id_token_signed_response_algorithm'],
          expression: '"id_token_signed_response_algorithm" <> \'none\'',
        },
        {
          name: 'check_userinfo_signed_response_algorithm',
          columnNames: ['userinfo_signed_response_algorithm'],
          expression: '"userinfo_signed_response_algorithm" <> \'none\'',
        },
        // {
        //   name: 'check_request_object_signing_algorithm',
        //   columnNames: ['request_object_signing_algorithm'],
        //   expression: '"request_object_signing_algorithm" <> \'none\'',
        // },
        {
          name: 'check_authorization_signed_response_algorithm',
          columnNames: ['authorization_signed_response_algorithm'],
          expression: '"authorization_signed_response_algorithm" <> \'none\'',
        },
        {
          name: 'check_default_max_age',
          columnNames: ['default_max_age'],
          expression: '"default_max_age" > 0',
        },
      ],
      uniques: [
        {
          name: 'clients_secret_uq',
          columnNames: ['secret'],
        },
        {
          name: 'clients_pairwise_salt_uq',
          columnNames: ['pairwise_salt'],
        },
      ],
    });

    await queryRunner.createTable(table, true);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('clients', true);
  }
}
