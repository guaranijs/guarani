import { Dictionary, OneOrMany } from '@guarani/types';

/**
 * Parameters of the **None** Client Authentication Method.
 */
export interface NoneClientAuthenticationParameters extends Dictionary<OneOrMany<string>> {
  /**
   * Client Identifier.
   */
  readonly client_id: string;

  /**
   * ~Client Secret.~
   */
  readonly client_secret?: undefined;
}
