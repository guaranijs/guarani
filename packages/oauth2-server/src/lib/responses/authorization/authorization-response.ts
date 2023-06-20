import { Dictionary, Nullable, OneOrMany } from '@guarani/types';

/**
 * Parameters of the OAuth 2.0 Authorization Response.
 */
export interface AuthorizationResponse
  extends Dictionary<Nullable<OneOrMany<string> | OneOrMany<number> | OneOrMany<boolean>>> {
  /**
   * State of the Client prior to the Authorization Request.
   */
  state?: string;

  /**
   * Authorization Server Issuer Identifier.
   */
  iss?: string;
}
