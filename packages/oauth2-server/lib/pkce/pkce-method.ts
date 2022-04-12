import { SupportedPkceMethod } from './types/supported-pkce-method';

/**
 * Interface with the Parameters of a **Proof Key for Code Exchange** defined by
 * {@link https://www.rfc-editor.org/rfc/rfc7636.html Proof Key for Code Exchange by OAuth Public Clients}.
 */
export interface PkceMethod {
  /**
   * Name of the PKCE Method.
   */
  readonly name: SupportedPkceMethod;

  /**
   * Checks if the Code Verifier provided by the Client at the Token Endpoint
   * matches the Code Challenge provided at the Authorization Endpoint.
   *
   * @param codeChallenge Code Challenge provided at the Authorization Endpoint.
   * @param codeVerifier Code Verifier provided at the Token Endpoint.
   */
  verify(codeChallenge: string, codeVerifier: string): boolean;
}
