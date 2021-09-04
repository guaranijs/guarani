import { Injectable } from '@guarani/ioc'

import { timingSafeEqual } from 'crypto'

import {
  RevocationEndpoint as BaseRevocationEndpoint,
  RevocationParameters
} from '../../../lib/endpoints'
import { AccessToken, Client, RefreshToken } from '../../entities'

@Injectable()
// @ts-expect-error
export class RevocationEndpoint extends BaseRevocationEndpoint {
  protected async revokeToken(
    client: Client,
    data: RevocationParameters
  ): Promise<void> {
    const token =
      (await RefreshToken.findOne({ where: { token: data.token } })) ??
      (await AccessToken.findOne({ where: { token: data.token } }))

    if (!token) {
      return
    }

    const clientId = Buffer.from(client.getClientId())
    const tokenClientId = Buffer.from(token.getClient().getClientId())

    if (!timingSafeEqual(clientId, tokenClientId)) {
      return
    }

    if (
      token.isRevoked() ||
      new Date() > token.getExpiresAt() ||
      new Date() < token.getValidAfter()
    ) {
      return
    }

    await token.softRemove()
  }
}
