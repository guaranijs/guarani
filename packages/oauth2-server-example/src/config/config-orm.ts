import path from 'path';
import { DataSource } from 'typeorm';

export async function configOrm(): Promise<DataSource> {
  const dataSource = new DataSource({
    type: 'sqlite',
    database: path.join(process.cwd(), 'db.sqlite3'),
    entities: [path.join(process.cwd(), 'src', 'entities', '**', '*.entity.ts')],
    synchronize: true,
  });

  return await dataSource.initialize();
}
