import { Inject, Injectable, InjectAll } from '@guarani/ioc'

import { SupportedEndpoint } from '../constants'
import { Request, Response } from '../context'
import {
  AuthorizationEndpoint,
  Endpoint,
  TokenEndpoint,
  UserConsent
} from '../endpoints'

@Injectable()
export abstract class Provider {
  @Inject()
  private readonly authorizationEndpoint: AuthorizationEndpoint

  @Inject()
  private readonly tokenEndpoint: TokenEndpoint

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
    return await this.authorizationEndpoint.handle(request)
  }

  public async consent(request: Request): Promise<UserConsent> {
    return this.authorizationEndpoint.getUserConsent(request)
  }

  public async token(request: Request): Promise<Response> {
    return this.tokenEndpoint.handle(request)
  }

  public abstract createOAuth2Request(request: unknown): Request
}
