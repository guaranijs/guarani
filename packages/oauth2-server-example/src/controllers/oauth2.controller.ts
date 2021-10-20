import {
  Request as GuaraniRequest,
  Response as GuaraniResponse
} from '@guarani/oauth2'

import { Request, Response } from 'express'
import { User } from '../entities'

import { OAuth2Provider } from '../oauth2/app-provider'

class Controller {
  public async authorize(request: Request, response: Response) {
    const guaraniRequest = Controller.createOAuth2Request(request)

    guaraniRequest.user = <User>request.user

    const guaraniResponse = await OAuth2Provider.endpoint(
      'authorization',
      guaraniRequest
    )

    return Controller.parseResponse(guaraniResponse, response)
  }

  public async error(request: Request, response: Response) {
    return response.render('oauth2/error', {
      title: 'Authorization Error',
      ...request.query
    })
  }

  public async introspect(request: Request, response: Response) {
    const guaraniRequest = Controller.createOAuth2Request(request)
    const guaraniResponse = await OAuth2Provider.endpoint(
      'introspection',
      guaraniRequest
    )

    return Controller.parseResponse(guaraniResponse, response)
  }

  public async revoke(request: Request, response: Response) {
    const guaraniRequest = Controller.createOAuth2Request(request)
    const guaraniResponse = await OAuth2Provider.endpoint(
      'revocation',
      guaraniRequest
    )

    return Controller.parseResponse(guaraniResponse, response)
  }

  public async token(request: Request, response: Response) {
    const guaraniRequest = Controller.createOAuth2Request(request)
    const guaraniResponse = await OAuth2Provider.endpoint(
      'token',
      guaraniRequest
    )

    return Controller.parseResponse(guaraniResponse, response)
  }

  private static createOAuth2Request(request: Request): GuaraniRequest {
    return new GuaraniRequest(request)
  }

  private static parseResponse(response: GuaraniResponse, res: Response) {
    Object.entries(response.headers).forEach(([name, value]) =>
      res.setHeader(name, value)
    )

    return res.status(response.statusCode).send(response.body)
  }
}

export const OAuth2Controller = new Controller()
