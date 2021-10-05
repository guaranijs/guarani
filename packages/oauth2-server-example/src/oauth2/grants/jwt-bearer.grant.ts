import { Injectable } from '@guarani/ioc'
import {
  JsonWebTokenClaims,
  JsonWebSignatureHeader,
  JsonWebKey,
  SupportedJWSAlgorithm
} from '@guarani/jose'
import { JWTBearerGrant as BaseJWTBearerGrant } from '@guarani/oauth2'

import { Client, User } from '../../entities'

@Injectable()
export class JWTBearerGrant extends BaseJWTBearerGrant {
  protected async getIssuerKey(
    client: Client,
    header: JsonWebSignatureHeader,
    claims: JsonWebTokenClaims // eslint-disable-line
  ): Promise<[JsonWebKey, SupportedJWSAlgorithm?]> {
    return [await client.getPublicKey(header.kid), 'ES256']
  }

  protected async authenticateUser(userId: string): Promise<User> {
    return await User.findOne({ where: { id: userId } })
  }
}
