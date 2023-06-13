import { Dictionary, OneOrMany } from '@guarani/types';

/**
 * Parameters of the OAuth 2.0 Put Client Registration Request Query Parameters.
 */
export interface PutQueryRegistrationRequest extends Dictionary<OneOrMany<string>> {
  /**
   * Identifier of the Client.
   */
  readonly client_id: string;
}
