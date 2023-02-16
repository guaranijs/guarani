import { ClientAssertion } from './client-assertion.type';

/**
 * Parameters of a Client Assertion.
 */
export interface ClientAssertionParameters extends Record<string, any> {
  /**
   * Client Assertion provided by the Client.
   */
  readonly client_assertion: string;

  /**
   * Client Assertion Type requested by the Client.
   */
  readonly client_assertion_type: ClientAssertion;
}
