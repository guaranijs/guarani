import { Express, static as serveStatic } from 'express'
import path from 'path'
import favicon from 'serve-favicon'

export function configureStaticServer(app: Express): void {
  app.use(favicon(path.join(__dirname, '..', 'static', 'favicon.ico')))
  app.use('/static', serveStatic(path.join(__dirname, '..', 'static')))
}
