import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateAccessTokensTable1678672372374 implements MigrationInterface {
  public readonly name: string = 'create_access_tokens_table_1678672372374';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = new Table({
      name: 'access_tokens',
      columns: [
        {
          name: 'handle',
          type: 'varchar',
          isNullable: false,
          isPrimary: true,
          length: '32',
          primaryKeyConstraintName: 'access_tokens_pk',
        },
        {
          name: 'scopes',
          type: 'varchar',
          isArray: true,
          isNullable: false,
        },
        {
          name: 'is_revoked',
          type: 'boolean',
          default: false,
          isNullable: false,
        },
        {
          name: 'issued_at',
          type: 'timestamp',
          isNullable: false,
        },
        {
          name: 'expires_at',
          type: 'timestamp',
          isNullable: false,
        },
        {
          name: 'valid_after',
          type: 'timestamp',
          isNullable: false,
        },
        {
          name: 'client_id',
          type: 'uuid',
          foreignKeyConstraintName: 'clients_id_fk',
          isNullable: true,
        },
        {
          name: 'user_id',
          type: 'uuid',
          foreignKeyConstraintName: 'users_id_fk',
          isNullable: true,
        },
      ],
      checks: [
        {
          name: 'check_handle_length',
          columnNames: ['handle'],
          expression: 'length("handle") = 32',
        },
      ],
      foreignKeys: [
        {
          name: 'clients_id_fk',
          columnNames: ['client_id'],
          referencedTableName: 'clients',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
        },
        {
          name: 'users_id_fk',
          columnNames: ['user_id'],
          referencedTableName: 'users',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
        },
      ],
    });

    await queryRunner.createTable(table, true, true);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('access_tokens', true, true);
  }
}
