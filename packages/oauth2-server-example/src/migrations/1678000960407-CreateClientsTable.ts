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
          name: 'secret_issued_at',
          type: 'timestamp',
          default: 'CURRENT_TIMESTAMP',
          isNullable: true,
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
          default: 'public',
          isNullable: false,
        },
        {
          name: 'sector_identifier_uri',
          type: 'varchar',
          isNullable: true,
        },
        {
          name: 'id_token_signed_response_algorithm',
          type: 'varchar',
          isNullable: true,
        },
        // {
        //   name: 'id_token_encrypted_response_key_wrap',
        //   type: 'varchar',
        //   isNullable: true,
        // },
        // {
        //   name: 'id_token_encrypted_response_content_encryption',
        //   type: 'varchar',
        //   isNullable: true,
        // },
        // {
        //   name: 'userinfo_signed_response_algorithm',
        //   type: 'varchar',
        //   isNullable: true,
        // },
        // {
        //   name: 'userinfo_encrypted_response_key_wrap',
        //   type: 'varchar',
        //   isNullable: true,
        // },
        // {
        //   name: 'userinfo_encrypted_response_content_encryption',
        //   type: 'varchar',
        //   isNullable: true,
        // },
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
          default: "'{}'",
          isArray: true,
          isNullable: false,
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
          name: 'check_secret_issuance',
          columnNames: ['secret', 'secret_issued_at'],
          expression:
            '("secret" IS NULL AND "secret_issued_at" IS NULL) OR ' +
            '("secret" IS NOT NULL AND "secret_issued_at" IS NOT NULL)',
        },
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
          name: 'check_id_token_signed_response_algorithm',
          columnNames: ['authentication_signing_algorithm'],
          expression: '"id_token_signed_response_algorithm" <> \'none\'',
        },
        // {
        //   name: 'check_userinfo_signed_response_algorithm',
        //   columnNames: ['userinfo_signed_response_algorithm'],
        //   expression: '"userinfo_signed_response_algorithm" <> \'none\'',
        // },
        // {
        //   name: 'check_request_object_signing_algorithm',
        //   columnNames: ['request_object_signing_algorithm'],
        //   expression: '"request_object_signing_algorithm" <> \'none\'',
        // },
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
      ],
    });

    await queryRunner.createTable(table, true);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('clients', true);
  }
}
