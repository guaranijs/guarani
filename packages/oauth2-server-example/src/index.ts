import ConnectRedis from 'connect-redis'
import cookieParser from 'cookie-parser'
import express, { urlencoded } from 'express'
import flash from 'express-flash'
import session from 'express-session'
import hbs from 'hbs'
import layouts from 'handlebars-layouts'
import morgan from 'morgan'
import path from 'path'
import { createConnection } from 'typeorm'

import { ormconfig } from './ormconfig'
import { redis } from './redis'
import { router } from './router'
import { initialize } from './strategy'

const PORT = process.env.PORT || 3333

async function configure(app: express.Express) {
  const secret = 'supersecretkeythatnoonewillbeabletoguess'

  const connection = await createConnection(ormconfig)
  await connection.synchronize()

  const RedisStore = ConnectRedis(session)

  app.set('views', path.join(__dirname, 'views'))
  app.set('view engine', 'hbs')

  // @ts-ignore
  hbs.registerHelper(layouts(hbs.handlebars))
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
      store: new RedisStore({ client: redis })
    })
  )

  initialize(app)

  app.use('/static', express.static(path.join(__dirname, 'static')))
}

async function main() {
  const app = express()

  await configure(app)

  app.use(router)

  app.listen(PORT, () => console.log(`Listening on port ${PORT}.`))
}

main()
