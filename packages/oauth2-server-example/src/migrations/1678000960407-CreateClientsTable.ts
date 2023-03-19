import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateClientsTable1678000960407 implements MigrationInterface {
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
          name: 'scopes',
          type: 'varchar',
          isArray: true,
          isNullable: false,
        },
        {
          name: 'logo_uri',
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
          name: 'check_secret_length',
          columnNames: ['secret'],
          expression: 'length("secret") = 32',
        },
        {
          name: 'check_name_length',
          columnNames: ['name'],
          expression: 'length("name") >= 4 AND length("name") <= 32',
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
