import { Inject, Injectable, InjectAll } from '@guarani/ioc'

import { Adapter } from '../adapter'
import { ClientAuthentication } from '../authentication'
import {
  OAuth2EmptyResponse,
  OAuth2JSONResponse,
  OAuth2Request,
  OAuth2Response
} from '../context'
import {
  InvalidClient,
  InvalidRequest,
  OAuth2Error,
  ServerError,
  UnsupportedTokenType
} from '../exceptions'
import { OAuth2Client } from '../models'
import { Endpoint } from './endpoint'

interface RevocationRequest {
  readonly token: string
  readonly token_type_hint?: string
}

@Injectable()
export class RevocationEndpoint implements Endpoint {
  public readonly name: string = 'revocation'

  private readonly headers = { 'Cache-Control': 'no-store', Pragma: 'no-cache' }

  public constructor(
    @Inject('Adapter') protected readonly adapter: Adapter,
    @InjectAll('ClientAuthentication')
    private readonly methods: ClientAuthentication[]
  ) {}

  public async handle(
    request: OAuth2Request<RevocationRequest>
  ): Promise<OAuth2Response> {
    try {
      const { data } = request

      this.checkRequest(data)

      const client = await this.authenticate(request)

      await this.revokeToken(data, client)

      return new OAuth2EmptyResponse({ headers: this.headers })
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

  protected checkRequest(data: RevocationRequest): void {
    const { token, token_type_hint } = data

    if (!token || typeof token !== 'string') {
      throw new InvalidRequest({ description: 'Invalid parameter "token".' })
    }

    if (
      token_type_hint &&
      !['access_token', 'refresh_token'].includes(token_type_hint)
    ) {
      throw new UnsupportedTokenType({
        description: `Unsupported token_type "${token_type_hint}".`
      })
    }
  }

  protected async authenticate(request: OAuth2Request): Promise<OAuth2Client> {
    for (const method of this.methods) {
      const client = await method.authenticate(request)

      if (!client) {
        continue
      }

      return client
    }

    throw new InvalidClient({ description: 'Invalid Client.' })
  }

  protected async revokeToken(
    data: RevocationRequest,
    client: OAuth2Client
  ): Promise<void> {
    const accessToken = await this.adapter.findAccessToken(data.token)

    if (accessToken) {
      if (this.adapter.deleteAccessToken == null) {
        throw new UnsupportedTokenType({
          description:
            'This server does not support the revocation of access tokens.'
        })
      }

      if (accessToken.getClientId() === client.getId()) {
        await this.adapter.deleteAccessToken(data.token)
      }

      return
    }

    const refreshToken = await this.adapter.findRefreshToken(data.token)

    if (refreshToken) {
      if (refreshToken.getClientId() === client.getId()) {
        await this.adapter.deleteRefreshToken(data.token)
      }
    }
  }
}
