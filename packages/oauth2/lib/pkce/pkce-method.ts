import { SupportedPkceMethod } from '../constants'

/**
 * Definition of a PKCE Method.
 */
export interface PkceMethod {
  /**
   * Name of the PKCE Method.
   */
  readonly name: SupportedPkceMethod

  /**
   * Checks if the Code Verifier provided by the Client at the Token Endpoint
   * matches the Code Challenge provided at the Authorization Endpoint.
   *
   * @param challenge Code Challenge provided at the Authorization Endpoint.
   * @param verifier Code Verifier provided at the Token Endpoint.
   */
  compare(challenge: string, verifier: string): boolean
}
