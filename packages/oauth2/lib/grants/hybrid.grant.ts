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
  /**
   * Name of the Grant.
   */
  public readonly name: SupportedGrantType = null

  /**
   * Names of the Grant's Response Types.
   */
  public readonly responseTypes: SupportedResponseType[] = [
    'code id_token',
    'code token',
    'code id_token token'
  ]

  /**
   * Default Response Mode of the Grant.
   */
  public readonly defaultResponseMode: SupportedResponseMode = 'fragment'

  /**
   * Name of the Grant's Grant Type.
   */
  public readonly grantType: SupportedGrantType = null

  public async authorize(
    request: Request,
    client: Client,
    user: User
  ): Promise<any> {}

  public async token(request: Request, client: Client): Promise<OAuth2Token> {}
}
