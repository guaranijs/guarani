import { Inject, Injectable } from '@guarani/ioc'

import { Adapter } from '../adapter'
import { TokenRequest as BaseTokenRequest } from '../endpoints'
import { AccessDenied, InvalidRequest } from '../exceptions'
import { OAuth2Client, OAuth2Token } from '../models'
import { generateToken } from '../utils/token'
import { TokenGrant } from './token-grant'

interface TokenRequest extends BaseTokenRequest {
  readonly scope: string
}

@Injectable()
export class ClientCredentialsGrant implements TokenGrant {
  public readonly grantType: string = 'client_credentials'

  public constructor(@Inject('Adapter') protected readonly adapter: Adapter) {}

  public async token(
    data: TokenRequest,
    client: OAuth2Client
  ): Promise<OAuth2Token> {
    this.checkTokenRequest(data)

    const scopes = this.checkScope(client, data)
    const token = await this.adapter.createAccessToken(client, null, scopes)

    return generateToken(token)
  }

  protected checkTokenRequest(data: TokenRequest): void {
    const { scope } = data

    if (!scope || typeof scope !== 'string') {
      throw new InvalidRequest({ description: 'Invalid parameter "scope".' })
    }
  }

  private checkScope(client: OAuth2Client, data: TokenRequest): string[] {
    const scopes = client.checkScope(data.scope)

    if (!scopes) {
      throw new AccessDenied({
        description: 'This Client is not allowed to request this scope.'
      })
    }

    return scopes
  }
}
