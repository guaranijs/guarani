import { Injectable } from '@guarani/di';

import { Buffer } from 'buffer';
import { timingSafeEqual } from 'crypto';

import { PkceMethod } from './pkce-method.type';
import { PkceInterface } from './pkce.interface';

/**
 * Implementation of the **Plain** PKCE Method.
 *
 * @see https://www.rfc-editor.org/rfc/rfc7636.html#section-4.2
 */
@Injectable()
export class PlainPkce implements PkceInterface {
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
    const challengeBuffer = Buffer.from(challenge, 'utf8');
    const verifierBuffer = Buffer.from(verifier, 'utf8');

    return challengeBuffer.length === verifierBuffer.length && timingSafeEqual(challengeBuffer, verifierBuffer);
  }
}
