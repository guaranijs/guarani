import { Optional } from '@guarani/types';

import { SupportedOAuth2ErrorCode } from './supported-oauth2-error-code';

/**
 * Parameters of the OAuth 2.0 Exception.
 */
export interface OAuth2ExceptionParams {
  /**
   * OAuth 2.0 Error Code.
   */
  readonly error: SupportedOAuth2ErrorCode;

  /**
   * Description of the Error.
   */
  error_description?: Optional<string>;

  /**
   * URI containing more information about the Error.
   */
  error_uri?: Optional<string>;

  /**
   * State of the Client prior to the Request.
   */
  state?: Optional<string>;

  /**
   * Additional Optional Parameters.
   */
  [parameter: string]: any;
}
