import { Optional } from '@guarani/types';
import { TokenParameters } from './token.parameters';

/**
 * Parameters of the Token Request of the Refresh Token Grant Type.
 */
export interface RefreshTokenParameters extends TokenParameters {
  /**
   * Refresh Token issued by the Authorization Server.
   */
  readonly refresh_token: string;

  /**
   * Subset of the Scope of the Refresh Token.
   */
  readonly scope?: Optional<string>;
}
