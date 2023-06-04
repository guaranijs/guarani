import { Dictionary } from '@guarani/types';

import { ClientAssertion } from './client-assertion.type';

/**
 * Parameters of a Client Assertion.
 */
export interface ClientAssertionParameters<TClietAssertion extends ClientAssertion = ClientAssertion>
  extends Dictionary<unknown> {
  /**
   * Client Assertion provided by the Client.
   */
  readonly client_assertion: string;

  /**
   * Client Assertion Type requested by the Client.
   */
  readonly client_assertion_type: TClietAssertion;
}
