import { Injectable, InjectAll } from '@guarani/ioc'

import { OAuth2Request, OAuth2Response } from '../context'
import { Endpoint } from '../endpoints'

@Injectable()
export class Provider {
  @InjectAll('Endpoint')
  private readonly endpoints: Endpoint[]

  private async endpoint(
    name: string,
    request: OAuth2Request
  ): Promise<OAuth2Response> {
    const endpoint = this.endpoints.find(endpoint => endpoint.name === name)

    if (!endpoint) {
      throw new Error(`Endpoint "${name}" not registered.`)
    }

    return await endpoint.handle(request)
  }

  public async authorize(request: OAuth2Request): Promise<OAuth2Response> {
    return await this.endpoint('authorization', request)
  }

  public async token(request: OAuth2Request): Promise<OAuth2Response> {
    return await this.endpoint('token', request)
  }

  public async revoke(request: OAuth2Request): Promise<OAuth2Response> {
    return await this.endpoint('revocation', request)
  }

  public async introspect(request: OAuth2Request): Promise<OAuth2Response> {
    return await this.endpoint('introspection', request)
  }
}
