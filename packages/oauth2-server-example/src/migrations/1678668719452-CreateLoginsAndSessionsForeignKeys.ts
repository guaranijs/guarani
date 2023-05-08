import { MigrationInterface, QueryRunner, TableForeignKey } from 'typeorm';

export class CreateLoginsAndSessionsForeignKeys1678668719452 implements MigrationInterface {
  public readonly name: string = 'create_logins_and_sessions_foreign_keys_1678668719452';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createForeignKeys('logins', [
      new TableForeignKey({
        name: 'users_id_fk',
        columnNames: ['user_id'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      }),
      new TableForeignKey({
        name: 'sessions_id_fk',
        columnNames: ['session_id'],
        referencedTableName: 'sessions',
        referencedColumnNames: ['id'],
        onDelete: 'NO ACTION',
        onUpdate: 'CASCADE',
      }),
    ]);

    await queryRunner.createForeignKey(
      'sessions',
      new TableForeignKey({
        name: 'logins_id_fk',
        columnNames: ['active_login_id'],
        referencedTableName: 'logins',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey('sessions', 'logins_id_fk');

    await queryRunner.dropForeignKey('logins', 'users_id_fk');
    await queryRunner.dropForeignKey('logins', 'sessions_id_fk');
  }
}
