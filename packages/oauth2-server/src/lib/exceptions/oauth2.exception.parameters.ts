/**
 * Parameters of the OAuth 2.0 Exception.
 */
export interface OAuth2ExceptionParameters {
  /**
   * Description of the OAuth 2.0 Exception.
   */
  description?: string;

  /**
   * URI of the page containing the details of the OAuth 2.0 Exception.
   */
  uri?: string;

  /**
   * State of the Client Application prior to the OAuth 2.0 Request.
   */
  state?: string;

  /**
   * Authorization Server Issuer Identifier.
   */
  iss?: string;
}
