import { Dictionary } from '@guarani/types';

/**
 * Interface of the Body of the OAuth 2.0 Error Response.
 */
export interface OAuth2ExceptionResponse extends Dictionary<unknown> {
  /**
   * Error Code of the OAuth 2.0 Exception.
   */
  readonly error: string;

  /**
   * Description of the OAuth 2.0 Exception.
   */
  error_description?: string;

  /**
   * URI of the page containing the details of the OAuth 2.0 Exception.
   */
  error_uri?: string;

  /**
   * State of the Client Application prior to the OAuth 2.0 Request.
   */
  state?: string;

  /**
   * Authorization Server Issuer Identifier.
   */
  iss?: string;
}
