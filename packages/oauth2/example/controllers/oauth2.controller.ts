import { getContainer } from '@guarani/ioc'
import { Dict } from '@guarani/utils'

import { Request, Response } from 'express'
import { URL } from 'url'

import { ProviderFactory } from '../../lib/bootstrap'
import { Response as GuaraniResponse } from '../../lib/context'
import { Settings } from '../../lib/settings'
import { User } from '../entities'
import { AppProvider } from '../oauth2'

class Controller {
  private static readonly provider = ProviderFactory.create(AppProvider)

  public async authorize(request: Request, response: Response) {
    const guaraniRequest = Controller.provider.createOAuth2Request(request)

    const { confirm } = request.body

    if (confirm === 'yes') {
      guaraniRequest.user = <User>request.user
    }

    const guaraniResponse = await Controller.provider.authorize(guaraniRequest)

    return Controller.parseResponse(guaraniResponse, response)
  }

  public async consent(request: Request, response: Response) {
    const user = request.user

    if (!user) {
      const redirectTo = encodeURIComponent(request.originalUrl)
      return response.redirect(303, `/auth/login?redirect_to=${redirectTo}`)
    }

    const guaraniRequest = Controller.provider.createOAuth2Request(request)

    try {
      const { client, scopes } = await Controller.provider.consent(
        guaraniRequest
      )

      const csrf = request.csrfToken()

      return response.render('authorize', {
        title: 'App Authorization',
        csrf,
        user: request.user,
        client,
        scopes,
        actionUrl: request.url
      })
    } catch (error) {
      const { errorUrl } = getContainer('oauth2').resolve(Settings)
      const baseUrl = `${request.protocol}://${request.get('host')}`
      const url = new URL(errorUrl, baseUrl)

      Object.entries(<Dict>error.toJSON()).forEach(([name, value]) =>
        url.searchParams.set(name, value)
      )

      return response.redirect(url.href)
    }
  }

  public async error(request: Request, response: Response) {
    return response.render('error', {
      title: 'Authorization Error',
      ...request.query
    })
  }

  public async introspect(request: Request, response: Response) {
    const guaraniRequest = Controller.provider.createOAuth2Request(request)
    const guaraniResponse = await Controller.provider.endpoint(
      'introspection',
      guaraniRequest
    )

    return Controller.parseResponse(guaraniResponse, response)
  }

  public async revoke(request: Request, response: Response) {
    const guaraniRequest = Controller.provider.createOAuth2Request(request)
    const guaraniResponse = await Controller.provider.endpoint(
      'revocation',
      guaraniRequest
    )

    return Controller.parseResponse(guaraniResponse, response)
  }

  public async token(request: Request, response: Response) {
    const guaraniRequest = Controller.provider.createOAuth2Request(request)
    const guaraniResponse = await Controller.provider.token(guaraniRequest)

    return Controller.parseResponse(guaraniResponse, response)
  }

  private static parseResponse(response: GuaraniResponse, res: Response) {
    Object.entries(response.headers).forEach(([name, value]) =>
      res.setHeader(name, value)
    )

    return res.status(response.statusCode).send(response.body)
  }
}

export const OAuth2Controller = new Controller()
