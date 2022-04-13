import { Optional } from '@guarani/types';

import { TokenParameters } from './token.parameters';

/**
 * Parameters of the Token Request of the Client Credentials Grant Type.
 */
export interface ClientCredentialsParameters extends TokenParameters {
  /**
   * Scope requested by the Client.
   */
  readonly scope?: Optional<string>;
}
