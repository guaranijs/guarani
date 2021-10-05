import { TypeormStore } from 'connect-typeorm'
import cookieParser from 'cookie-parser'
import express, { urlencoded } from 'express'
import flash from 'express-flash'
import session from 'express-session'
import hbs from 'hbs'
import layouts from 'handlebars-layouts'
import morgan from 'morgan'
import path from 'path'
import favicon from 'serve-favicon'
import { createConnection } from 'typeorm'

import { ormconfig } from './ormconfig'
import { router } from './router'
import { initialize } from './strategy'
import { Session } from './entities'

const PORT = process.env.PORT || 3333

async function configure(app: express.Express) {
  const secret = 'supersecretkeythatnoonewillbeabletoguess'

  const connection = await createConnection(ormconfig)
  await connection.synchronize()

  const sessionRepository = connection.getRepository(Session)

  app.set('views', path.join(__dirname, 'views'))
  app.set('view engine', 'hbs')

  // @ts-ignore
  hbs.registerHelper(layouts(hbs.handlebars))
  hbs.registerHelper('json', data => JSON.stringify(data))
  hbs.registerHelper('optional', data => data ?? '--')
  hbs.registerHelper('date', (date: Date) =>
    date.toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  )

  hbs.registerPartials(path.join(__dirname, 'views', 'partials'))

  app.use(morgan('dev'))
  app.use(urlencoded({ extended: true }))
  app.use(flash())
  app.use(cookieParser(secret))
  app.use(
    session({
      name: 'guarani',
      secret,
      resave: false,
      saveUninitialized: false,
      // @ts-ignore
      store: new TypeormStore({ cleanupLimit: 2, ttl: 43200 }).connect(
        sessionRepository
      )
    })
  )

  initialize(app)

  app.use(favicon(path.join(__dirname, 'static', 'favicon.ico')))
  app.use('/static', express.static(path.join(__dirname, 'static')))
}

async function main() {
  const app = express()

  await configure(app)

  app.use(router)

  app.listen(PORT, () => console.log(`Listening on port ${PORT}.`))
}

main()
