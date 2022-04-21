import path from 'path';
import { DataSource } from 'typeorm';

import { ClientEntity } from '../entities/client.entity';
import { SessionEntity } from '../entities/session.entity';
import { UserEntity } from '../entities/user.entity';

export async function typeormConfig(): Promise<DataSource> {
  const dataSource = new DataSource({
    type: 'sqlite',
    database: path.join(process.cwd(), 'db.sqlite3'),
    entities: [ClientEntity, SessionEntity, UserEntity],
    synchronize: true,
  });

  await dataSource.initialize();
  await dataSource.synchronize();

  return dataSource;
}
