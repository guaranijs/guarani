import { Dictionary } from '@guarani/types';

/**
 * Parameters of the OAuth 2.0 Put Client Registration Request Query Parameters.
 */
export interface PutQueryRegistrationRequest extends Dictionary<any> {
  /**
   * Identifier of the Client.
   */
  readonly client_id: string;
}
