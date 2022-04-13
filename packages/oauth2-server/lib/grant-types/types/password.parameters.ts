import { Optional } from '@guarani/types';

import { TokenParameters } from './token.parameters';

/**
 * Parameters of the Token Request of the Password Grant Type.
 */
export interface PasswordParameters extends TokenParameters {
  /**
   * Username of the User represented by the Client.
   */
  readonly username: string;

  /**
   * Password of the User represented by the Client.
   */
  readonly password: string;

  /**
   * Scope requested by the Client.
   */
  readonly scope?: Optional<string>;
}
