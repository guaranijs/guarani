import { Injectable } from '@guarani/di';

import { PkceMethod } from '../types/pkce-method';
import { IPkceMethod } from './pkce-method.interface';

/**
 * Implementation of the **Plain** PKCE Method.
 *
 * @see https://www.rfc-editor.org/rfc/rfc7636.html#section-4.2
 */
@Injectable()
export class PlainPkceMethod implements IPkceMethod {
  /**
   * Name of the PKCE Method.
   */
  public readonly name: PkceMethod = 'plain';

  /**
   * Performs a simple string comparison between the Authorization Code Challenge
   * and the Authorization Code Verifier provided by the Client.
   *
   * @param challenge Authorization Code Challenge provided at the Authorization Endpoint.
   * @param verifier Authorization Code Verifier provided at the Token Endpoint.
   */
  public verify(challenge: string, verifier: string): boolean {
    return challenge === verifier;
  }
}
