import { PkceMethod } from '../types/pkce-method';
import { AbstractToken } from './abstract-token';
import { User } from './user';

/**
 * OAuth 2.0 Authorization Code Entity.
 */
export interface AuthorizationCode extends AbstractToken {
  /**
   * Identifier of the Authorization Code.
   */
  code: string;

  /**
   * Redirect URI provided by the Client.
   */
  redirectUri: string;

  /**
   * Code Challenge provided by the Client.
   */
  codeChallenge: string;

  /**
   * Code Challenge Method used to verify the Code Challenge.
   */
  codeChallengeMethod: PkceMethod;

  /**
   * End User that granted authorization to the Client.
   */
  user: User;
}
