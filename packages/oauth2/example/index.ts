import ConnectRedis from 'connect-redis'
import express, { urlencoded } from 'express'
import flash from 'express-flash'
import session from 'express-session'
import hbs from 'hbs'
import layouts from 'handlebars-layouts'
import morgan from 'morgan'
import path from 'path'
import { createConnection } from 'typeorm'

import { ProviderFactory } from '../lib/bootstrap'
import { AppProvider } from './oauth2'
import { ormconfig } from './ormconfig'
import { redis } from './redis'
import { router } from './router'
import { initialize } from './strategy'
import { User } from './entities'

const PORT = process.env.PORT || 3333

async function configure(app: express.Express) {
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
  app.use(
    session({
      secret: 'supersecretkeythatnoonewillbeabletoguess',
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
  const provider = ProviderFactory.create(AppProvider)

  await configure(app)

  app.get('/oauth2/authorize', async (req, res) => {
    const request = provider.createOAuth2Request(req)

    // The User accepted the requested scopes.
    request.user = <User>req.user

    const response = await provider.authorize(request)

    Object.entries(response.headers).forEach(([name, value]) =>
      res.setHeader(name, value)
    )

    return res.status(response.statusCode).send(response.body)
  })

  app.get('/oauth2/error', async (req, res) => {
    return res.json(req.query)
  })

  app.post('/oauth2/introspect', async (req, res) => {
    const request = provider.createOAuth2Request(req)
    const response = await provider.endpoint('introspection', request)

    Object.entries(response.headers).forEach(([name, value]) =>
      res.setHeader(name, value)
    )

    return res.status(response.statusCode).send(response.body)
  })

  app.post('/oauth2/revoke', async (req, res) => {
    const request = provider.createOAuth2Request(req)
    const response = await provider.endpoint('revocation', request)

    Object.entries(response.headers).forEach(([name, value]) =>
      res.setHeader(name, value)
    )

    return res.status(response.statusCode).send(response.body)
  })

  app.post('/oauth2/token', async (req, res) => {
    const request = provider.createOAuth2Request(req)
    const response = await provider.token(request)

    Object.entries(response.headers).forEach(([name, value]) =>
      res.setHeader(name, value)
    )

    return res.status(response.statusCode).send(response.body)
  })

  app.use(router)

  app.listen(PORT, () => console.log(`Listening on port ${PORT}.`))
}

main()
