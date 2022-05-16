import { Optional } from '@guarani/types';

import { TokenParameters } from './token-parameters';

/**
 * Parameters of the Refresh Token Token Request.
 */
export interface RefreshTokenTokenParameters extends TokenParameters {
  /**
   * Refresh Token issued by the Authorization Server.
   */
  readonly refresh_token: string;

  /**
   * Subset of the Scope of the Refresh Token.
   */
  readonly scope?: Optional<string>;
}
