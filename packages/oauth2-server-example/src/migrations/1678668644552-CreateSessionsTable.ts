import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateSessionsTable1678668644552 implements MigrationInterface {
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
          foreignKeyConstraintName: 'users_id_fk',
          isNullable: false,
        },
      ],
      foreignKeys: [
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
    await queryRunner.dropTable('sessions', true, true);
  }
}
