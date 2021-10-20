import { config } from 'dotenv'
import express, { urlencoded } from 'express'
import flash from 'express-flash'
import morgan from 'morgan'
import { createConnection } from 'typeorm'

import {
  configurePassport,
  configureSession,
  configureStaticServer,
  configureViews
} from './configs'
import { ormconfig } from './ormconfig'
import { router } from './router'

config()

const PORT = process.env.AUTHORIZATION_SERVER_PORT || '3333'

async function main() {
  const app = express()

  const connection = await createConnection(ormconfig)
  await connection.synchronize()

  app.use(morgan('dev'))
  app.use(urlencoded({ extended: true }))
  app.use(flash())

  configureViews(app)
  configureStaticServer(app)
  await configureSession(app)
  await configurePassport(app)

  app.use(router)

  app.listen(PORT, () => console.log(`Listening on port ${PORT}`))
}

main()
