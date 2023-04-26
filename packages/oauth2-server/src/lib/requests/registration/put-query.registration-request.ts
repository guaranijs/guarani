/**
 * Parameters of the OAuth 2.0 Put Client Registration Request Query Parameters.
 */
export interface PutQueryRegistrationRequest extends Record<string, any> {
  /**
   * Identifier of the Client.
   */
  readonly client_id: string;
}
