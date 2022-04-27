import { Dict, Optional } from '@guarani/types';

import { ErrorCode } from '../types/error-code';

/**
 * Parameters of the OAuth 2.0 Exception.
 */
export interface ErrorResponse extends Dict {
  /**
   * OAuth 2.0 Error Code.
   */
  readonly error: ErrorCode;

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
}
