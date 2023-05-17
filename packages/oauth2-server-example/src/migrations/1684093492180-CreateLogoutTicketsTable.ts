import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateLogoutTicketsTable1684093492180 implements MigrationInterface {
  public readonly name: string = 'create_logout_tickets_table_1684093492180';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = new Table({
      name: 'logout_tickets',
      columns: [
        {
          name: 'id',
          type: 'uuid',
          generationStrategy: 'uuid',
          isGenerated: true,
          isNullable: false,
          isPrimary: true,
          primaryKeyConstraintName: 'logout_tickets_pk',
        },
        {
          name: 'logout_challenge',
          type: 'varchar',
          isNullable: false,
          isUnique: true,
        },
        {
          name: 'parameters',
          type: 'json',
          isNullable: false,
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
          name: 'client_id',
          type: 'uuid',
          foreignKeyConstraintName: 'clients_id_fk',
          isNullable: false,
        },
        {
          name: 'session_id',
          type: 'uuid',
          foreignKeyConstraintName: 'sessions_id_fk',
          isNullable: true,
        },
      ],
      checks: [
        {
          name: 'check_logout_challenge_length',
          columnNames: ['logout_challenge'],
          expression: 'length("logout_challenge") = 32',
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
          name: 'sessions_id_fk',
          columnNames: ['session_id'],
          referencedTableName: 'sessions',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
        },
      ],
      uniques: [
        {
          name: 'logout_tickets_logout_challenge_uq',
          columnNames: ['logout_challenge'],
        },
      ],
    });

    await queryRunner.createTable(table, true, true);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('logout_tickets', true, true);
  }
}
