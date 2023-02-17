/**
 * Parameters of the OAuth 2.0 Device Authorization Request.
 */
export interface DeviceAuthorizationRequest extends Record<string, any> {
  /**
   * Identifier of the Client.
   */
  readonly client_id?: string;

  /**
   * Scope requested by the Client.
   */
  readonly scope?: string;
}
