import { Dictionary } from '@guarani/types';

/**
 * Parameters of the OAuth 2.0 Delete Client Registration Request.
 */
export interface DeleteRegistrationRequest extends Dictionary<any> {
  /**
   * Identifier of the Client.
   */
  readonly client_id: string;
}
