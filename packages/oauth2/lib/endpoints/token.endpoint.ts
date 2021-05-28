import { Injectable, InjectAll } from '@guarani/ioc'

import { ClientAuthentication } from '../authentication'
import { OAuth2JSONResponse, OAuth2Request, OAuth2Response } from '../context'
import {
  InvalidClient,
  InvalidRequest,
  OAuth2Error,
  ServerError,
  UnauthorizedClient,
  UnsupportedGrantType
} from '../exceptions'
import { TokenGrant } from '../grants'
import { OAuth2Client } from '../models'
import { Endpoint } from './endpoint'

export interface TokenRequest {
  readonly grant_type: string
}

@Injectable()
export class TokenEndpoint implements Endpoint {
  public readonly name: string = 'token'

  private readonly headers = { 'Cache-Control': 'no-store', Pragma: 'no-cache' }

  public constructor(
    @InjectAll('Grant') private readonly grants: TokenGrant[],
    @InjectAll('ClientAuthentication')
    private readonly methods: ClientAuthentication[]
  ) {}

  public async handle(
    request: OAuth2Request<TokenRequest>
  ): Promise<OAuth2Response> {
    try {
      const { data } = request

      this.checkRequest(data)

      const client = await this.authenticate(request)
      const grant = this.getGrant(data.grant_type)

      this.checkClientGrant(client, grant)

      const token = await grant.token(data, client)

      return new OAuth2JSONResponse({ body: token })
    } catch (error) {
      const err =
        error instanceof OAuth2Error
          ? error
          : new ServerError({ description: error.message })

      return new OAuth2JSONResponse({
        body: err.data,
        headers: { ...err.headers, ...this.headers },
        statusCode: err.status_code
      })
    }
  }

  private checkRequest(data: TokenRequest): void {
    const { grant_type } = data

    if (!grant_type || typeof grant_type !== 'string') {
      throw new InvalidRequest({
        description: 'Invalid parameter "grant_type".'
      })
    }
  }

  private async authenticate(request: OAuth2Request): Promise<OAuth2Client> {
    for (const method of this.methods) {
      const client = await method.authenticate(request)

      if (!client) {
        continue
      }

      return client
    }

    throw new InvalidClient({ description: 'Invalid Client.' })
  }

  private getGrant(grantType: string): TokenGrant {
    const grant = this.grants.find(grant => grant.grantType === grantType)

    if (!grant) {
      throw new UnsupportedGrantType({
        description: `Unsupported grant_type "${grantType}".`
      })
    }

    return grant
  }

  private checkClientGrant(client: OAuth2Client, grant: TokenGrant): void {
    if (!client.checkGrantType(grant.grantType)) {
      throw new UnauthorizedClient({
        description:
          'This Client is not allowed to use ' +
          `the grant_type "${grant.grantType}".`
      })
    }
  }
}
