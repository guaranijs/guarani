import { Injectable } from '@guarani/di';

import { Buffer } from 'buffer';
import { timingSafeEqual } from 'crypto';

import { PkceInterface } from './pkce.interface';
import { Pkce } from './pkce.type';

/**
 * Implementation of the **Plain** PKCE.
 *
 * @see https://www.rfc-editor.org/rfc/rfc7636.html#section-4.2
 */
@Injectable()
export class PlainPkce implements PkceInterface {
  /**
   * Name of the PKCE.
   */
  public readonly name: Pkce = 'plain';

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
