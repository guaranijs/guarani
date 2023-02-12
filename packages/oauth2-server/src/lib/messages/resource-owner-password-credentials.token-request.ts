import { TokenRequest } from './token-request';

/**
 * Parameters of the **Resource Owner Password Credentials** Token Request.
 */
export interface ResourceOwnerPasswordCredentialsTokenRequest extends TokenRequest {
  /**
   * Username of the End User represented by the Client.
   */
  readonly username: string;

  /**
   * Password of the End User represented by the Client.
   */
  readonly password: string;

  /**
   * Scope requested by the Client.
   */
  readonly scope?: string;
}
