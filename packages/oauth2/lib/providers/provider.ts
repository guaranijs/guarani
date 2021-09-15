import { Injectable, InjectAll } from '@guarani/ioc'

import { SupportedEndpoint } from '../constants'
import { Request, Response } from '../context'
import { Endpoint } from '../endpoints'
import { GrantType, ResponseType, UserConsent } from '../grants'

@Injectable()
export abstract class Provider {
  @InjectAll('Endpoint')
  private readonly endpoints: Endpoint[]

  public async endpoint(
    name: SupportedEndpoint,
    request: Request
  ): Promise<Response> {
    const endpoint = this.endpoints.find(endpoint => endpoint.name === name)

    if (!endpoint) {
      throw new Error(`Unsupported Endpoint "${name}".`)
    }

    return await endpoint.handle(request)
  }

  public async authorize(request: Request): Promise<Response> {
    return await ResponseType.createAuthorizationResponse(request)
  }

  public async consent(request: Request): Promise<UserConsent> {
    return await ResponseType.getUserConsent(request)
  }

  public async token(request: Request): Promise<Response> {
    return await GrantType.createTokenResponse(request)
  }

  public abstract createOAuth2Request(request: unknown): Request
}
