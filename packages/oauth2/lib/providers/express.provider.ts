import { Router, urlencoded } from 'express'

import { OAuth2Request } from '../context'
import { Provider } from './provider'

export class ExpressProvider extends Provider {
  private _router: Router

  public get router(): Router {
    if (!this._router) {
      this._router = Router()

      this._router.use(urlencoded({ extended: true }))

      this._router.get('/oauth2/authorize', async (req, res) => {
        const request = new OAuth2Request({
          body: req.body,
          headers: req.headers,
          query: req.query,
          user: req.user as any
        })

        const response = await this.authorize(request)

        Object.entries(response.headers).forEach(([name, value]) =>
          res.setHeader(name, value)
        )

        return res.status(response.statusCode).send(response.body)
      })

      this._router.post('/oauth2/token', async (req, res) => {
        const request = new OAuth2Request({
          body: req.body,
          headers: req.headers,
          query: req.query
        })

        const response = await this.token(request)

        Object.entries(response.headers).forEach(([name, value]) =>
          res.setHeader(name, value)
        )

        return res.status(response.statusCode).send(response.body)
      })

      this._router.post('/oauth2/revoke', async (req, res) => {
        const request = new OAuth2Request({
          body: req.body,
          headers: req.headers,
          query: req.query
        })

        const response = await this.revoke(request)

        Object.entries(response.headers).forEach(([name, value]) =>
          res.setHeader(name, value)
        )

        return res.status(response.statusCode).send(response.body)
      })

      this._router.post('/oauth2/introspect', async (req, res) => {
        const request = new OAuth2Request({
          body: req.body,
          headers: req.headers,
          query: req.query
        })

        const response = await this.introspect(request)

        Object.entries(response.headers).forEach(([name, value]) =>
          res.setHeader(name, value)
        )

        return res.status(response.statusCode).send(response.body)
      })
    }

    return this._router
  }
}
