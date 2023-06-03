import { Dictionary } from '@guarani/types';

/**
 * Parameters of the OAuth 2.0 Get Client Registration Request.
 */
export interface GetRegistrationRequest extends Dictionary<unknown> {
  /**
   * Identifier of the Client.
   */
  readonly client_id: string;
}
