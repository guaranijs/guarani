/**
 * Parameters of the OAuth 2.0 Get Client Registration Request.
 */
export interface GetRegistrationRequest extends Record<string, any> {
  /**
   * Identifier of the Client.
   */
  readonly client_id: string;
}
