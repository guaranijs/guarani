import { TokenType } from '../types/token-type';
import { AbstractToken } from './abstract-token';

/**
 * OAuth 2.0 Access Token Entity.
 */
export interface AccessToken extends AbstractToken {
  /**
   * Identifier of the Access Token.
   */
  token: string;

  /**
   * Type of the Access Token.
   */
  tokenType: TokenType;
}
