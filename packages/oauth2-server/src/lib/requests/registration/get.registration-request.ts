import { Dictionary, OneOrMany } from '@guarani/types';

/**
 * Parameters of the OAuth 2.0 Get Client Registration Request.
 */
export interface GetRegistrationRequest extends Dictionary<OneOrMany<string>> {
  /**
   * Identifier of the Client.
   */
  readonly client_id: string;
}
