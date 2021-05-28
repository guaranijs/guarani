import { Inject, Injectable } from '@guarani/ioc'

import { Adapter } from '../adapter'
import { AuthorizationRequest } from '../endpoints'
import { OAuth2Client, OAuth2Token, OAuth2User } from '../models'
import { generateToken } from '../utils/token'
import { AuthorizationGrant } from './authorization-grant'

@Injectable()
export class ImplicitGrant implements AuthorizationGrant {
  public readonly responseType: string = 'token'
  public readonly responseMode: string = 'fragment'

  public constructor(@Inject('Adapter') protected readonly adapter: Adapter) {}

  public async authorize(
    data: AuthorizationRequest,
    scopes: string[],
    client: OAuth2Client,
    user: OAuth2User
  ): Promise<OAuth2Token> {
    const token = await this.adapter.createAccessToken(client, user, scopes)
    return generateToken(token)
  }
}
