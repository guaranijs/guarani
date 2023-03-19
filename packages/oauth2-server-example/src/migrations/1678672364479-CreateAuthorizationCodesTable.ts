import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateAuthorizationCodesTable1678672364479 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = new Table({
      name: 'authorization_codes',
      columns: [
        {
          name: 'code',
          type: 'uuid',
          generationStrategy: 'uuid',
          isGenerated: true,
          isNullable: false,
          isPrimary: true,
          primaryKeyConstraintName: 'authorization_codes_pk',
        },
        {
          name: 'is_revoked',
          type: 'boolean',
          default: false,
          isNullable: false,
        },
        {
          name: 'parameters',
          type: 'json',
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
          name: 'session_id',
          type: 'uuid',
          foreignKeyConstraintName: 'sessions_id_fk',
          isNullable: false,
          isUnique: true,
        },
        {
          name: 'consent_id',
          type: 'uuid',
          foreignKeyConstraintName: 'consents_id_fk',
          isNullable: false,
          isUnique: true,
        },
      ],
      foreignKeys: [
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
          name: 'authorization_codes_session_id_uq',
          columnNames: ['session_id'],
        },
        {
          name: 'authorization_codes_consent_id_uq',
          columnNames: ['consent_id'],
        },
        {
          name: 'authorization_codes_session_id_and_consent_id_uq',
          columnNames: ['session_id', 'consent_id'],
        },
      ],
    });

    await queryRunner.createTable(table, true, true);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('authorization_codes', true, true);
  }
}
