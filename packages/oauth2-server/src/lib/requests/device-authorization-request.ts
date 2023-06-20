import { Dictionary, OneOrMany } from '@guarani/types';

/**
 * Parameters of the OAuth 2.0 Device Authorization Request.
 */
export interface DeviceAuthorizationRequest extends Dictionary<OneOrMany<string>> {
  /**
   * Scope requested by the Client.
   */
  readonly scope?: string;
}
