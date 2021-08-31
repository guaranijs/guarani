import { Injectable } from '@guarani/ioc'

import {
  SupportedGrantType,
  SupportedResponseMode,
  SupportedResponseType
} from '../constants'
import { Request } from '../context'
import { Client, OAuth2Token, User } from '../entities'
import { Grant } from './grant'
import { GrantType } from './grant-type'
import { ResponseType } from './response-type'

@Injectable()
export class HybridGrant extends Grant implements ResponseType, GrantType {
  public readonly name: SupportedGrantType = null

  public readonly responseTypes: SupportedResponseType[] = [
    'code id_token',
    'code token',
    'code id_token token'
  ]

  public readonly defaultResponseMode: SupportedResponseMode = 'fragment'

  public readonly grantType: SupportedGrantType = null

  public async authorize(
    request: Request,
    client: Client,
    user: User
  ): Promise<any> {}

  public async token(request: Request, client: Client): Promise<OAuth2Token> {}
}
