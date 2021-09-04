import { Request, Response } from 'express'

import { ProviderFactory } from '../../lib/bootstrap'
import { Response as GuaraniResponse } from '../../lib/context'
import { User } from '../entities'
import { AppProvider } from '../oauth2'

class Controller {
  private static readonly provider = ProviderFactory.create(AppProvider)

  public async authorize(request: Request, response: Response) {
    const guaraniRequest = Controller.provider.createOAuth2Request(request)

    // The User accepted the requested scopes.
    guaraniRequest.user = <User>request.user

    const guaraniResponse = await Controller.provider.endpoint(
      'authorization',
      guaraniRequest
    )

    return Controller.parseResponse(guaraniResponse, response)
  }

  public async error(request: Request, response: Response) {
    return response.json(request.query)
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
    const guaraniResponse = await Controller.provider.endpoint(
      'token',
      guaraniRequest
    )

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
