import path from 'path'
import { ConnectionOptions } from 'typeorm'

export const ormconfig: ConnectionOptions = {
  type: 'sqlite',
  database: path.join(__dirname, 'guarani.db'),
  entities: [path.join(__dirname, 'entities', '**', '*.entity.ts')],
  synchronize: true
}
