import { ErrorCode } from './error-code.enum';
import { OAuth2Exception } from './oauth2.exception';

/**
 * Raised when the Http Header **Content-Type** is not valid for the Endpoint.
 */
export class UnsupportedMediaTypeException extends OAuth2Exception {
  /**
   * OAuth 2.0 Error Code.
   */
  public readonly error = ErrorCode.UnsupportedMediaType;

  /**
   * Http Response Status Code of the OAuth 2.0 Exception.
   */
  public override readonly statusCode: number = 415;
}
