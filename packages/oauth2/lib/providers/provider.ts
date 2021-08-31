import { Inject, Injectable } from '@guarani/ioc'

import { Request, Response } from '../context'
import { AuthorizationEndpoint, TokenEndpoint } from '../endpoints'

@Injectable()
export abstract class Provider {
  @Inject()
  private readonly authorizationEndpoint: AuthorizationEndpoint

  @Inject()
  private readonly tokenEndpoint: TokenEndpoint

  public async authorize(request: Request): Promise<Response> {
    return await this.authorizationEndpoint.handle(request)
  }

  public async token(request: Request): Promise<Response> {
    return await this.tokenEndpoint.handle(request)
  }

  public abstract createOAuth2Request(request: unknown): Request
}
