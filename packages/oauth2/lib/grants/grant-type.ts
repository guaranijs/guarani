import { OneOrMany } from '@guarani/utils'

import { Request } from '../context'
import { Client } from '../entities'
import { OAuth2Token } from './grant'

/**
 * Defines the default parameters of the Token Request.
 */
export interface TokenParameters {
  /**
   * Grant Type requested by the Client.
   */
  readonly grant_type: string

  /**
   * Resource requested by the Client.
   */
  readonly resource?: OneOrMany<string>
}

/**
 * Interface of the Token Flow of the OAuth 2.0 Grants.
 */
export interface GrantType<TParams extends TokenParameters> {
  /**
   * Name of the Grant's Grant Type.
   */
  readonly GRANT_TYPE: string

  /**
   * Implementation of the Grant's Token Flow.
   *
   * @param request Current Request.
   * @param client Client of the Request.
   * @returns OAuth 2.0 Token Response.
   */
  token(request: Request<TParams>, client: Client): Promise<OAuth2Token>
}
