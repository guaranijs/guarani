/**
 * Parameters of the OAuth 2.0 Authorization Response.
 */
export interface AuthorizationResponse extends Record<string, any> {
  /**
   * State of the Client prior to the Authorization Request.
   */
  state?: string;

  /**
   * Authorization Server Issuer Identifier.
   */
  iss?: string;
}