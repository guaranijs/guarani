/**
 * Parameters of the OAuth 2.0 Delete Client Registration Request.
 */
export interface DeleteRegistrationRequest extends Record<string, any> {
  /**
   * Identifier of the Client.
   */
  readonly client_id: string;
}
