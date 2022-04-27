import { PkceMethod } from '../types/pkce-method';

/**
 * Interface with the Parameters of a Proof Key for Code Exchange.
 *
 * @see https://www.rfc-editor.org/rfc/rfc7636.html
 */
export interface IPkceMethod {
  /**
   * Name of the PKCE Method.
   */
  readonly name: PkceMethod;

  /**
   * Checks if the Authorization Code Verifier provided by the Client at the Token Endpoint
   * matches the Authorization Code Challenge provided at the Authorization Endpoint.
   *
   * @param challenge Authorization Code Challenge provided at the Authorization Endpoint.
   * @param verifier Authorization Code Verifier provided at the Token Endpoint.
   */
  verify(challenge: string, verifier: string): boolean;
}
