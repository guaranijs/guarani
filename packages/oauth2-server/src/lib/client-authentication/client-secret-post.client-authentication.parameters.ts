import { Dictionary, OneOrMany } from '@guarani/types';

/**
 * Parameters of the **Client Secret Post** Client Authentication Method.
 */
export interface ClientSecretPostClientAuthenticationParameters extends Dictionary<OneOrMany<string>> {
  /**
   * Client Identifier.
   */
  readonly client_id: string;

  /**
   * Client Secret.
   */
  readonly client_secret: string;
}
