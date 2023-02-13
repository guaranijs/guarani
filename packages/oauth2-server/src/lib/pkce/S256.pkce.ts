import { Injectable } from '@guarani/di';

import { Buffer } from 'buffer';
import { createHash, timingSafeEqual } from 'crypto';

import { PkceMethod } from './pkce-method.type';
import { PkceInterface } from './pkce.interface';

/**
 * Implementation of the **S256** PKCE Method.
 *
 * @see https://www.rfc-editor.org/rfc/rfc7636.html#section-4.2
 */
@Injectable()
export class S256Pkce implements PkceInterface {
  /**
   * Name of the PKCE Method.
   */
  public readonly name: PkceMethod = 'S256';

  /**
   * Performs a comparison between the Authorization Code Challenge hash received at the Authorization Endpoint
   * and the ASCII Base64Url Encoded SHA-256 hash of the Authorization Code Verifier received at the Token Endpoint.
   *
   * @param challenge Authorization Code Challenge provided at the Authorization Endpoint.
   * @param verifier Authorization Code Verifier provided at the Token Endpoint.
   */
  public verify(challenge: string, verifier: string): boolean {
    const challengeBuffer = Buffer.from(challenge, 'base64url');
    const verifierBuffer = createHash('sha256').update(verifier, 'ascii').digest();

    return challengeBuffer.length === verifierBuffer.length && timingSafeEqual(challengeBuffer, verifierBuffer);
  }
}
