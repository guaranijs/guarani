import { Optional } from '@guarani/types';

import { TokenParameters } from './token-parameters';

/**
 * Parameters of the Client Credentials Token Request.
 */
export interface ClientCredentialsTokenParameters extends TokenParameters {
  /**
   * Scope requested by the Client.
   */
  readonly scope?: Optional<string>;
}
