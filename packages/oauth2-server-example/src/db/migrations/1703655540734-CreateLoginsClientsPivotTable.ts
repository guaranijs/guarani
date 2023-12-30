import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateLoginsClientsPivotTable1703655540734 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = new Table({
      name: 'logins_clients',
      columns: [
        {
          name: 'login_id',
          type: 'uuid',
          isNullable: false,
          isPrimary: true,
          primaryKeyConstraintName: 'logins_clients_pk',
        },
        {
          name: 'client_id',
          type: 'uuid',
          isNullable: false,
          isPrimary: true,
          primaryKeyConstraintName: 'logins_clients_pk',
        },
      ],
      foreignKeys: [
        {
          name: 'logins_clients_login_id',
          columnNames: ['login_id'],
          referencedTableName: 'logins',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
        },
        {
          name: 'logins_clients_client_id',
          columnNames: ['client_id'],
          referencedTableName: 'clients',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
        },
      ],
    });

    await queryRunner.createTable(table, true, true);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('logins_clients', true, true);
  }
}
