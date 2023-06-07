/**
 * Interface of the Body of the OAuth 2.0 Error Response.
 */
export interface OAuth2ExceptionResponse {
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
}
