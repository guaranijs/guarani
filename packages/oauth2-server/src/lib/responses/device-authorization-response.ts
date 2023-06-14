import { Dictionary } from '@guarani/types';

/**
 * Parameters of the OAuth 2.0 Device Authorization Response.
 */
export interface DeviceAuthorizationResponse extends Dictionary<unknown> {
  /**
   * Device Verification Code.
   */
  readonly device_code: string;

  /**
   * User Verification Code.
   */
  readonly user_code: string;

  /**
   * User Verification URI on the Authorization Server.
   */
  readonly verification_uri: string;

  /**
   * User Verification URI on the Authorization Server for non-textual transmission.
   */
  readonly verification_uri_complete?: string;

  /**
   * Lifespan in seconds of the `device_code` and `user_code`.
   */
  readonly expires_in: number;

  /**
   * Minimum amount of time in seconds that the Client should wait between polling requests to the Token Endpoint.
   */
  readonly interval: number;
}
