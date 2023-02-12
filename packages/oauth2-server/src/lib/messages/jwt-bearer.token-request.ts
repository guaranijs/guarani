import { TokenRequest } from './token-request';

/**
 * Parameters of the **JWT Bearer** Token Request.
 */
export interface JwtBearerTokenRequest extends TokenRequest {
  /**
   * JSON Web Token Assertion used as Authorization Grant.
   */
  readonly assertion: string;

  /**
   * Scope requested by the Client.
   */
  readonly scope?: string;
}
