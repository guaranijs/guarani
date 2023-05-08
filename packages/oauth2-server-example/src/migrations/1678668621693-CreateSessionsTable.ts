import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateSessionsTable1678668644552 implements MigrationInterface {
  public readonly name: string = 'create_sessions_table_1678668644552';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = new Table({
      name: 'sessions',
      columns: [
        {
          name: 'id',
          type: 'uuid',
          generationStrategy: 'uuid',
          isGenerated: true,
          isNullable: false,
          isPrimary: true,
          primaryKeyConstraintName: 'sessions_pk',
        },
        {
          name: 'active_login_id',
          type: 'uuid',
          isNullable: true,
          isUnique: true,
        },
      ],
      uniques: [
        {
          name: 'active_login_id_uq',
          columnNames: ['active_login_id'],
        },
      ],
    });

    await queryRunner.createTable(table, true);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('sessions', true);
  }
}
