import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateGrantsTable1678670149500 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = new Table({
      name: 'grants',
      columns: [
        {
          name: 'id',
          type: 'uuid',
          generationStrategy: 'uuid',
          isGenerated: true,
          isNullable: false,
          isPrimary: true,
          primaryKeyConstraintName: 'grants_pk',
        },
        {
          name: 'login_challenge',
          type: 'varchar',
          isNullable: false,
          isUnique: true,
        },
        {
          name: 'consent_challenge',
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
          isUnique: true,
        },
        {
          name: 'consent_id',
          type: 'uuid',
          foreignKeyConstraintName: 'consents_id_fk',
          isNullable: true,
          isUnique: true,
        },
      ],
      checks: [
        {
          name: 'check_login_challenge_length',
          columnNames: ['login_challenge'],
          expression: 'length("login_challenge") = 32',
        },
        {
          name: 'check_consent_challenge_length',
          columnNames: ['consent_challenge'],
          expression: 'length("consent_challenge") = 32',
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
        {
          name: 'consents_id_fk',
          columnNames: ['consent_id'],
          referencedTableName: 'consents',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
        },
      ],
      uniques: [
        {
          name: 'grants_login_challenge_uq',
          columnNames: ['login_challenge'],
        },
        {
          name: 'grants_consent_challenge_uq',
          columnNames: ['consent_challenge'],
        },
        {
          name: 'grants_session_id_uq',
          columnNames: ['session_id'],
        },
        {
          name: 'grants_consent_id_uq',
          columnNames: ['consent_id'],
        },
        {
          name: 'grants_login_challenge_and_consent_challenge_uq',
          columnNames: ['login_challenge', 'consent_challenge'],
        },
        {
          name: 'grants_session_id_and_consent_id_uq',
          columnNames: ['session_id', 'consent_id'],
        },
      ],
    });

    await queryRunner.createTable(table, true, true);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('grants', true, true);
  }
}
