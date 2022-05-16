import { Dict, Optional } from '@guarani/types';

/**
 * Parameters of the OAuth 2.0 Authorizaion Response.
 */
export interface AuthorizationResponse extends Dict {
  /**
   * State of the Client prior to the Authorization Request.
   */
  readonly state?: Optional<string>;
}
