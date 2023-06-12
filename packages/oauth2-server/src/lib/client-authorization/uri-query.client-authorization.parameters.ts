import { Dictionary, OneOrMany } from '@guarani/types';

/**
 * Parameters of the **URI Query** Client Authorization Method.
 */
export interface UriQueryClientAuthorizationParameters extends Dictionary<OneOrMany<string>> {
  /**
   * Access Token Handle.
   */
  readonly access_token: string;
}
