import { Dictionary } from '@guarani/types';

/**
 * Parameters of the OAuth 2.0 Device Authorization Request.
 */
export interface DeviceAuthorizationRequest extends Dictionary<any> {
  /**
   * Scope requested by the Client.
   */
  readonly scope?: string;
}
