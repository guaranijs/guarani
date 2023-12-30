import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateRefreshTokensTable1678672379959 implements MigrationInterface {
  public readonly name: string = 'create_refresh_tokens_table_1678672379959';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = new Table({
      name: 'refresh_tokens',
      columns: [
        {
          name: 'handle',
          type: 'varchar',
          isNullable: false,
          isPrimary: true,
          length: '24',
          primaryKeyConstraintName: 'refresh_tokens_pk',
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
          isNullable: false,
        },
        {
          name: 'user_id',
          type: 'uuid',
          foreignKeyConstraintName: 'users_id_fk',
          isNullable: false,
        },
      ],
      checks: [
        {
          name: 'check_handle_length',
          columnNames: ['handle'],
          expression: 'length("handle") = 24',
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
    await queryRunner.dropTable('refresh_tokens', true, true);
  }
}
