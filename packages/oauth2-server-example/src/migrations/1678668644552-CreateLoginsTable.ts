import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateLoginsTable1678668644552 implements MigrationInterface {
  public readonly name: string = 'create_logins_table_1678668644552';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = new Table({
      name: 'logins',
      columns: [
        {
          name: 'id',
          type: 'uuid',
          generationStrategy: 'uuid',
          isGenerated: true,
          isNullable: false,
          isPrimary: true,
          primaryKeyConstraintName: 'logins_pk',
        },
        {
          name: 'amr',
          type: 'varchar',
          isArray: true,
          isNullable: true,
        },
        {
          name: 'acr',
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
          name: 'expires_at',
          type: 'timestamp',
          isNullable: true,
        },
        {
          name: 'user_id',
          type: 'uuid',
          isNullable: false,
        },
        {
          name: 'session_id',
          type: 'uuid',
          isNullable: false,
          isUnique: true,
        },
      ],
    });

    await queryRunner.createTable(table, true);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('logins', true);
  }
}
