import { Injectable } from '@guarani/ioc'

import { PkceMethod } from './pkce-method'

/**
 * PKCE Plain Method.
 */
@Injectable()
export class PlainPkceMethod implements PkceMethod {
  /**
   * Name of the PKCE Method.
   */
  public readonly name: string = 'plain'

  /**
   * Performs a simple string comparison between the Code Challenge
   * and the Code Verifier provided by the Client.
   *
   * @param challenge Code Challenge provided at the Authorization Endpoint.
   * @param verifier Code Verifier provided at the Token Endpoint.
   */
  public compare(challenge: string, verifier: string): boolean {
    return challenge === verifier
  }
}
