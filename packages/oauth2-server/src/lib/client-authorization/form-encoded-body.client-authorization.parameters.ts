import { Dictionary, OneOrMany } from '@guarani/types';

/**
 * Parameters of the **Form Encoded Body** Client Authorization Method.
 */
export interface FormEncodedBodyClientAuthorizationParameters extends Dictionary<OneOrMany<string>> {
  /**
   * Access Token Identifier.
   */
  readonly access_token: string;
}
