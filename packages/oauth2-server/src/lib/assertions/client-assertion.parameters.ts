import { Dictionary, OneOrMany } from '@guarani/types';

import { ClientAssertion } from './client-assertion.type';

/**
 * Parameters of a Client Assertion.
 */
export interface ClientAssertionParameters extends Dictionary<OneOrMany<string>> {
  /**
   * Client Assertion Type requested by the Client.
   */
  readonly client_assertion_type: ClientAssertion;

  /**
   * Client Assertion provided by the Client.
   */
  readonly client_assertion: string;
}
