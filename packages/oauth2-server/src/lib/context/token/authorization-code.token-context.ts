import { URL } from 'url';

import { AuthorizationCode } from '../../entities/authorization-code.entity';
import { TokenContext } from './token-context';

/**
 * Parameters of the **Authorization Code** Token Context.
 */
export interface AuthorizationCodeTokenContext extends TokenContext {
  /**
   * Authorization Code provided by the Client.
   */
  readonly authorizationCode: AuthorizationCode;

  /**
   * Redirect URI provided by the Client.
   */
  readonly redirectUri: URL;

  /**
   * Code Verifier provided by the Client.
   */
  readonly codeVerifier: string;
}
