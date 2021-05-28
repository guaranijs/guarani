import { Inject, Injectable, InjectAll } from '@guarani/ioc'

import { Adapter } from '../adapter'
import { ClientAuthentication } from '../authentication'
import { OAuth2JSONResponse, OAuth2Request, OAuth2Response } from '../context'
import {
  InvalidClient,
  InvalidRequest,
  OAuth2Error,
  ServerError,
  UnsupportedTokenType
} from '../exceptions'
import { OAuth2Client, TokenMetadata } from '../models'
import { Endpoint } from './endpoint'

interface IntrospectionRequest {
  readonly token: string
  readonly token_type_hint?: string
}

@Injectable()
export class IntrospectionEndpoint implements Endpoint {
  public readonly name: string = 'introspection'

  private readonly headers = { 'Cache-Control': 'no-store', Pragma: 'no-cache' }

  public constructor(
    @Inject('Adapter') protected readonly adapter: Adapter,
    @InjectAll('ClientAuthentication')
    private readonly methods: ClientAuthentication[]
  ) {}

  public async handle(
    request: OAuth2Request<IntrospectionRequest>
  ): Promise<OAuth2Response> {
    try {
      const { data } = request

      this.checkRequest(data)

      const client = await this.authenticate(request)
      const response = await this.introspectToken(data, client)

      return new OAuth2JSONResponse({ body: response, headers: this.headers })
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

  protected checkRequest(data: IntrospectionRequest): void {
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

  protected async introspectToken(
    data: IntrospectionRequest,
    client: OAuth2Client
  ): Promise<TokenMetadata> {
    const accessToken = await this.adapter.findAccessToken(data.token)

    if (accessToken) {
      return await this.adapter.getTokenMetadata(client, accessToken)
    }

    const refreshToken = await this.adapter.findRefreshToken(data.token)

    if (refreshToken) {
      return await this.adapter.getTokenMetadata(client, refreshToken)
    }

    return { active: false }
  }
}
