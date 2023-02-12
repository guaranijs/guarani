import { TokenRequest } from './token-request';

/**
 * Parameters of the **Client Credentials** Token Request.
 */
export interface ClientCredentialsTokenRequest extends TokenRequest {
  /**
   * Scope requested by the Client.
   */
  readonly scope?: string;
}
