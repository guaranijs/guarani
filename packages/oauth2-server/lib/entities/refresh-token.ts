import { AbstractToken } from './abstract-token';
import { User } from './user';

/**
 * OAuth 2.0 Refresh Token Entity.
 */
export interface RefreshToken extends AbstractToken {
  /**
   * Identifier of the Refresh Token.
   */
  token: string;

  /**
   * End User that granted authorization to the Client.
   */
  user: User;
}
