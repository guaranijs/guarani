import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateDeviceCodesTable1678686707547 implements MigrationInterface {
  public readonly name: string = 'create_device_codes_table_1678686707547';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = new Table({
      name: 'device_codes',
      columns: [
        {
          name: 'id',
          type: 'uuid',
          generationStrategy: 'uuid',
          isGenerated: true,
          isNullable: false,
          isPrimary: true,
          primaryKeyConstraintName: 'device_codes_pk',
        },
        {
          name: 'user_code',
          type: 'varchar',
          isNullable: false,
          isUnique: true,
          length: '9',
        },
        {
          name: 'verification_url',
          type: 'varchar',
          isNullable: false,
        },
        {
          name: 'scopes',
          type: 'varchar',
          isArray: true,
          isNullable: false,
        },
        {
          name: 'is_authorized',
          type: 'boolean',
          isNullable: true,
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
          name: 'last_polled',
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
          name: 'user_id',
          type: 'uuid',
          foreignKeyConstraintName: 'users_id_fk',
          isNullable: true,
        },
      ],
      checks: [
        {
          name: 'check_user_code_length',
          columnNames: ['user_code'],
          expression: 'length("user_code") = 9',
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
      uniques: [
        {
          name: 'device_codes_user_code_uq',
          columnNames: ['user_code'],
        },
      ],
    });

    await queryRunner.createTable(table, true, true);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('device_codes', true, true);
  }
}
