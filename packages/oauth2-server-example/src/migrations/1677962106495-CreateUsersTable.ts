import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateUsersTable1677962106495 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = new Table({
      name: 'users',
      columns: [
        {
          name: 'id',
          type: 'uuid',
          generationStrategy: 'uuid',
          isGenerated: true,
          isNullable: false,
          isPrimary: true,
          primaryKeyConstraintName: 'users_pk',
        },
        {
          name: 'password',
          type: 'varchar',
          isNullable: false,
        },
        {
          name: 'given_name',
          type: 'varchar',
          isNullable: false,
        },
        {
          name: 'middle_name',
          type: 'varchar',
          isNullable: true,
        },
        {
          name: 'family_name',
          type: 'varchar',
          isNullable: false,
        },
        {
          name: 'picture',
          type: 'varchar',
          isNullable: true,
        },
        {
          name: 'email',
          type: 'varchar',
          isNullable: false,
          isUnique: true,
        },
        {
          name: 'email_verified',
          type: 'boolean',
          default: false,
          isNullable: false,
        },
        {
          name: 'gender',
          type: 'varchar',
          isNullable: true,
        },
        {
          name: 'birthdate',
          type: 'date',
          isNullable: false,
        },
        {
          name: 'phone_number',
          type: 'varchar',
          isNullable: false,
          isUnique: true,
        },
        {
          name: 'phone_number_verified',
          type: 'boolean',
          default: false,
          isNullable: false,
        },
        {
          name: 'address',
          type: 'varchar',
          isNullable: false,
        },
        {
          name: 'created_at',
          type: 'timestamp',
          default: 'CURRENT_TIMESTAMP',
          isNullable: false,
        },
        {
          name: 'updated_at',
          type: 'timestamp',
          default: 'CURRENT_TIMESTAMP',
          isNullable: false,
        },
        {
          name: 'deleted_at',
          type: 'timestamp',
          isNullable: true,
        },
      ],
      uniques: [
        {
          name: 'users_email_uq',
          columnNames: ['email'],
        },
        {
          name: 'users_phone_number_uq',
          columnNames: ['phone_number'],
        },
      ],
    });

    await queryRunner.createTable(table, true);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('users', true);
  }
}
