import path from 'path'

interface ORMConfig {
  readonly type: 'sqlite'
  readonly database: string
  readonly entities: string[]
  readonly synchronize: boolean
}

export const ormconfig: ORMConfig = {
  type: 'sqlite',
  database: path.join(__dirname, 'guarani.db'),
  entities: [path.join(__dirname, 'entities', '**', '*.entity.ts')],
  synchronize: true
}
