import { TypeormStore } from 'connect-typeorm'
import cookieParser from 'cookie-parser'
import { Express } from 'express'
import session from 'express-session'
import { getRepository } from 'typeorm'

import { Session } from '../entities'

export async function configureSession(app: Express): Promise<void> {
  const SECRET_KEY = process.env.SECRET_KEY

  const sessionRepository = getRepository(Session)

  app.use(cookieParser(SECRET_KEY))
  app.use(
    session({
      name: 'guarani',
      secret: SECRET_KEY,
      resave: false,
      saveUninitialized: false,
      store: new TypeormStore({ cleanupLimit: 2, ttl: 43200 }).connect(
        sessionRepository
      )
    })
  )
}
