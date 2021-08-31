import { SupportedGrantType } from '../constants'
import { Request } from '../context'
import { Client, OAuth2Token } from '../entities'

/**
 * Defines the default parameters of the Token Request.
 */
export interface TokenParameters {
  /**
   * Grant Type requested by the Client.
   */
  readonly grant_type: SupportedGrantType
}

/**
 * Interface of the Token Flow of the OAuth 2.0 Grants.
 */
export interface GrantType {
  /**
   * Name of the Grant's Grant Type.
   */
  readonly grantType: SupportedGrantType

  /**
   * Implementation of the Grant's Token Flow.
   *
   * @param request Current Request.
   * @param client Client requesting an OAuth 2.0 Token.
   * @returns OAuth 2.0 Token.
   */
  token(request: Request, client: Client): Promise<OAuth2Token>
}
