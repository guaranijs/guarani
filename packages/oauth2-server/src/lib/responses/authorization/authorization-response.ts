import { Dictionary } from '@guarani/types';

/**
 * Parameters of the OAuth 2.0 Authorization Response.
 */
export interface AuthorizationResponse extends Dictionary<string> {
  /**
   * State of the Client prior to the Authorization Request.
   */
  state?: string;

  /**
   * Authorization Server Issuer Identifier.
   */
  iss?: string;
}
