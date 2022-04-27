import { Optional } from '@guarani/types';

import { TokenParameters } from './token-parameters';

/**
 * Parameters of the Resource Owner Password Credentials Token Request.
 */
export interface PasswordTokenParameters extends TokenParameters {
  /**
   * Username of the End User represented by the Client.
   */
  readonly username: string;

  /**
   * Password of the End User represented by the Client.
   */
  readonly password: string;

  /**
   * Scope requested by the Client.
   */
  readonly scope?: Optional<string>;
}
