import { Inject, Injectable } from '@guarani/ioc'
import { removeNullishValues } from '@guarani/utils'

import { timingSafeEqual } from 'crypto'

import {
  IntrospectionEndpoint as BaseIntrospectionEndpoint,
  IntrospectionParameters,
  IntrospectionResponse
} from '../../../lib/endpoints'
import { Settings } from '../../../lib/settings'
import { AccessToken, Client, RefreshToken } from '../../entities'

@Injectable()
// @ts-expect-error
export class IntrospectionEndpoint extends BaseIntrospectionEndpoint {
  @Inject()
  // @ts-expect-error
  private readonly settings: Settings

  protected async introspectToken(
    client: Client,
    data: IntrospectionParameters
  ): Promise<IntrospectionResponse> {
    const token =
      (await AccessToken.findOne({ where: { token: data.token } })) ??
      (await RefreshToken.findOne({ where: { token: data.token } }))

    if (!token) {
      return this.inactiveToken
    }

    const clientId = Buffer.from(client.getClientId())
    const tokenClientId = Buffer.from(token.getClient().getClientId())

    if (!timingSafeEqual(clientId, tokenClientId)) {
      return this.inactiveToken
    }

    if (
      token.isRevoked() ||
      new Date() > token.getExpiresAt() ||
      new Date() < token.getValidAfter()
    ) {
      return this.inactiveToken
    }

    return removeNullishValues<IntrospectionResponse>({
      active: true,
      scope: token.getScopes().join(' '),
      client_id: token.getClient().getClientId(),
      username: token.getUser().email,
      token_type: 'Bearer',
      exp: Math.floor(token.getExpiresAt().getTime() / 1000),
      iat: Math.floor(token.getIssuedAt().getTime() / 1000),
      nbf: Math.floor(token.getValidAfter().getTime() / 1000),
      sub: token.getUser()?.getUserId() ?? token.getClient().getClientId(),
      aud: token.getAudience(),
      iss: this.settings.issuer,
      jti: null
    })
  }
}
