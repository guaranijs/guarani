import path from 'path';
import { DataSource } from 'typeorm';

import { AccessToken } from '../entities/access-token.entity';
import { AuthorizationCode } from '../entities/authorization-code.entity';
import { Client } from '../entities/client.entity';
import { RefreshToken } from '../entities/refresh-token.entity';
import { Session } from '../entities/session.entity';
import { User } from '../entities/user.entity';

export async function typeormConfig(): Promise<DataSource> {
  const dataSource = new DataSource({
    type: 'sqlite',
    database: path.join(process.cwd(), 'db.sqlite3'),
    entities: [User, Session, Client, AuthorizationCode, RefreshToken, AccessToken],
    synchronize: true,
  });

  await dataSource.initialize();
  await dataSource.synchronize();

  return dataSource;
}
